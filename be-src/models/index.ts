import { Model, DataTypes } from "sequelize";
import { sequelize } from "../sync";
import { v4 as uuidv4 } from "uuid";
/* Auth para iniciar sesión, pero se invoca tambien a la hora de registrarse.
Al iniciar sesión y querer extraer los datos se usa user_id
*/
class Auth extends Model {}
Auth.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: DataTypes.STRING,
    password: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: "auth",
  }
);

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: DataTypes.STRING,
    name: { type: DataTypes.STRING, defaultValue: "none" },
    location: { type: DataTypes.STRING, defaultValue: "none" },
    reports_published_id: {
      type: DataTypes.ARRAY(DataTypes.UUID), defaultValue: []
    },
    //ids de reportes hechos acerca de otras mascotas
    // last_seen_reports: {
    //   type: DataTypes.ARRAY(DataTypes.UUID),defaultValue: []
    // },
  },
  { sequelize, modelName: "user" }
);

// Este sería el post de la mascota perdida.
class ReportPublication extends Model {}
ReportPublication.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(), // Genera un UUIDv4 como valor por defecto
      primaryKey: true, // Define como clave primaria
      allowNull: false, // No permite valores nulos
      unique: true, // Debe ser único
    },
    name: DataTypes.STRING,
    pictureURL: DataTypes.STRING,
    location: DataTypes.STRING,
    last_seen_coordinates: DataTypes.JSON,
    finded: { type: DataTypes.BOOLEAN, defaultValue: false },
    email: DataTypes.STRING,
    // ids Reportes hechos sobre la ultima localizacion de esta mascota
    // last_seen_reports: { type: DataTypes.ARRAY(DataTypes.STRING) },
    reporterId: DataTypes.INTEGER,
  },
  { sequelize, modelName: "reportPublication" }
);

// class LastSeenReports extends Model {}
// LastSeenReports.init(
//   {
//     id: {
//       type: DataTypes.UUID,
//       defaultValue: () => uuidv4(), // Genera un UUIDv4 como valor por defecto
//       primaryKey: true, // Define como clave primaria
//       allowNull: false, // No permite valores nulos
//       unique: true, // Debe ser único
//     },
//     name: DataTypes.STRING,
//     phone: DataTypes.INTEGER,
//     last_seen_coordinates: DataTypes.STRING,
//     date: DataTypes.DATE,
//   },
//   { sequelize, modelName: "lastSeenReports" }
// );
// Un usuario puede tener muchas publicaciones y reportes (Muchas mascotas perdidas)
User.hasMany(ReportPublication);
// User.hasMany(LastSeenReports);
// Una publicación/reporte solo puede ser publicada/reportada por un solo usuario.
// LastSeenReports.belongsTo(User);
ReportPublication.belongsTo(User);

// Una publicación de mascota perdida puede tener muchos reportes
// ReportPublication.hasMany(LastSeenReports);
export { User, Auth, ReportPublication };
