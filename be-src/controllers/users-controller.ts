import { User, Auth } from "../models/index";
import { getSHA256ofString } from "./auth-controller";
import { sequelize } from "../sync";
// QUE DEVUELVA TODOS LOS USUARIOS
export async function getAllUsers() {
  const allUsers = await User.findAll();
  const authUsers = await Auth.findAll();
  return { allUsers, authUsers };
}

// BORRAR UN USUARIO
export async function deleteSpecificUser(userId) {
  const t = await sequelize.transaction(); // Iniciar una transacción

  try {
    await User.destroy({ where: { id: userId }, transaction: t });
    await Auth.destroy({ where: { id: userId }, transaction: t });

    await t.commit(); // Confirmar la transacción
    return "Usuario eliminado exitosamente.";
  } catch (error) {
    await t.rollback(); // Deshacer la transacción en caso de error
    throw error; // Propagar el error para su manejo posterior
  }
}

// MIS DATOS (MODIFICAR DATA)
export async function modifyUserData(userId, newData) {
  try {
    await User.update(newData, { where: { id: userId } });
    return "Datos del usuario modificados exitosamente.";
  } catch (error) {
    throw error;
  }
}
// CAMBIAR CONTRASEÑA
export async function modfiyPassword(userId, newPassword) {
  try {
    let passwordHasheado = getSHA256ofString(newPassword);
    await Auth.update(
      { password: passwordHasheado },
      { where: { id: userId } }
    );
    return "Contraseña actualizada correctamente";
  } catch (error) {
    throw error;
  }
}
