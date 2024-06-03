// Función para publicar un reporte
import { ReportPublication, User } from "../models";
import { index } from "../lib/algolia";
import { cloudinary } from "../lib/cloudinary";

export async function saveCoordinatesInAlgolia(coordinates, reportId){
  // saveCoordinatesInAlgolia Function executed
 try{
   const algoliaRes = await index.saveObject({
     id: reportId,
     _geoloc:{
       lat: coordinates.lat,
       lng: coordinates.lng,
     },
   },{autoGenerateObjectIDIfNotExist: true})
   console.log({algoliaRes})
  if (algoliaRes.objectID){
    // Se creó
    return true;
  } else {
    // No se creó
    return false;
  }
 }
 catch (err){
  console.log(err)
  throw err;
 }
}
export async function reportPublication(reportData, userId) {
  let reportId;
  let response = { message: "Respuesta vacía" };
  
  console.log("reportPublication recibió: ", reportData, userId);
  try {
    console.log("Iniciando publicación de reporte...");

    console.log("Subiendo imagen a Cloudinary...");
    const cloudinaryResponse = await cloudinary.uploader.upload(reportData.pictureURL, {
      resource_type: "image",
      discard_original_filename: true,
      width: 500,
    });
  
    if (cloudinaryResponse.secure_url) {
      console.log("Imagen subida exitosamente:", cloudinaryResponse);
      console.log("Creando nuevo reporte en la base de datos...");
      const reportCreationResponse = await ReportPublication.create({
        name: reportData.name,
        pictureURL: cloudinaryResponse.secure_url,
        location: reportData.location,
        last_seen_coordinates: reportData.coordinates,
        last_seen_reports: [],
        reporterId: userId,
        email: reportData.email,
      });

      if (reportCreationResponse.dataValues) {
        console.log("Reporte creado exitosamente", reportCreationResponse.dataValues);
        console.log("Actualizando los reportes publicados del usuario...");
        reportId = reportCreationResponse.get("id");

        const user = await User.findByPk(userId);
        let reportsArray  = user.get("reports_published_id")as any;
        reportsArray.push(reportId);

        await User.update(
          { reports_published_id: reportsArray },
          { where: { id: userId } }
        );

        console.log("Reportes del usuario actualizados exitosamente");
        console.log("Guardando reporte en Algolia...");

        const algoliaResponse = await saveCoordinatesInAlgolia(reportData.coordinates, reportId);

        if (algoliaResponse === true) {
          console.log("Guardado en algolia exitosamente!");
          response = { message: "Reporte hecho exitosamente!" };
        } else {
          console.log("Error en el guardado de algolia");
          response = { message: "Error en la creación de reporte" };
        }
      } else {
        response = { message: "Error al actualizar los reportes del usuario" };
      }
    } else {
      console.log("Error al subir la imagen");
    }
    return response;
  } catch (error) {
    console.error("Error en reportPublication:", error);
    return error;
  }
}
export async function getNearbyPets(coords){
  // Busca en algolia los ids de los cercanos, busca esos ids en los 
  // reports de Sequelize y los devuelve.
  console.log("coords: ", coords);
  try{
    // let hits
     const res = await index.search("",{
      aroundLatLng: coords,
      aroundRadius: 10000,
    });
    console.log(res.hits);
    if(res.hits.length === 0){
      return { message: "No hay mascotas perdidas cerca" }
    } else{
      // Por cada hit
      const ids = res.hits as any;
      const idsArrays = ids.map(item=>item.id)
      const allReports = await ReportPublication.findAll({
        where: {
          id: idsArrays
        }
    });
      return allReports;
    }
  }
  catch(err){
    console.error("Error: ", err)
  }
}

export async function getMyReports(userId){
  try{
    // Busca a través del reports_published_id del usuario, por cada id del array, un reporte
    const usuario = await User.findByPk(userId);
    if (!usuario){
      throw new Error("El usuario no existe? WTF")
    }
    const arrayDeIds = usuario.get("reports_published_id") as any;
    if (arrayDeIds.length === 0){
      return {message: "No ha hecho ningún reporte"}
    }
    else {
      const allReports = await ReportPublication.findAll({
        where: {
          id: arrayDeIds
        }
      });
      return allReports;
    }
  }
  catch(e){
    console.error("Error", e)
    throw Error;
  }
}

export async function deleteSpecificReport(){
  // Tendria que borrar las siguientes cosas:
      // El reporte de la base de datos
      // Eliminar del publicador, el id de la publicación
      // La imagen de Cloudinary

}
export async function updateReport(reportData){
  console.log("UpdateReport recibió: ", reportData)
let newPictureURL;

try{
  if (reportData.pictureURL){
    console.log("Empezando la actualización del reporte con la nueva foto...")
      // Generar la imagen en cloudinary
      console.log("Generando nueva imagen en cloudinary...")
      const cloudinaryResponse = await cloudinary.uploader.upload(reportData.pictureURL, {
        resource_type: "image",
        discard_original_filename: true,
        width: 500,
      });
      if (cloudinaryResponse.secure_url){
        newPictureURL = cloudinaryResponse.secure_url;
        console.log("Imagen subida con éxito, eliminando anterior...");
        // Obtener el publicId a partir del secure_url
        const publicId = cloudinaryResponse.secure_url.split('/').slice(-2).join('/').replace('.jpg', '');
        // Eliminar la antigua foto 
        await cloudinary.uploader.destroy(publicId, (error, result)=>{
          if (error) {
            console.error('Error eliminando la imagen:', error);
          } else {
            console.log('Imagen eliminada:');
          }
        })
        const editReportResponse = await ReportPublication.update({
          pictureURL: cloudinaryResponse.secure_url,
          name: reportData.name,
          location: reportData.location,
          last_seen_coordinates: reportData.coordinates,
        },{where:{
          id: reportData.id,
        }})
        return {message: "Reporte actualizado exitosamente!"};
    }
    else{
      return "Error generando la nueva imagen";
    }
  }
  else{
    console.log("Editando el reporte sin nueva imagen")
    const editReportResponse = await ReportPublication.update({
      name: reportData.name,
      location: reportData.location,
      last_seen_coordinates: reportData.coordinates,
    },{
      where:{
      id: reportData.id,
    }});
    return  {message: "Reporte actualizado exitosamente!"};
  }
  }
  catch(e){
    console.error(e)
  }
}
export async function deleteAllReports(){
  //Eliminar todas las fotos de Cloudinary
  //Todos los objects de algolia
  //Borrar todos los reportes de Sequelize
  //Actualizar los reports ids de todos los usuarios a un [] vacío.

  try {
  // CLOUDINARY
  const response = await cloudinary.uploader.destroy('*', { invalidate: true });
  console.log("cloudinary: ",response);
  
  // ALGOLIA
    // Destruir reportes
  const algoliaResult = await index.clearObjects();
  console.log("Se eliminaron todos los registros del indice de algolia", algoliaResult)
    // Actualizar users
  const actualizeUsers = await User.update(
      { reports_published_id: [] },
      { where: {}})
  // Sequelize
 const reportPublicationResult = await ReportPublication.destroy({where: {}})
  console.log("Se eliminaron",reportPublicationResult, "reportes" )

return{ message:"Todos los reportes han sido eliminados, de la base de datos, algolia, y cloudinary"}
} catch (error) {
  console.error('Error al eliminar assets de Cloudinary:', error);
  throw error;
}
}

export async function getAllReports(){
  // Devuelve todos los reportes
try {
  const allReports = await ReportPublication.findAll()
  return allReports;
}
catch (e){
  return e
}
}