import { Auth, User } from "../models";
import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";

const SECRET = process.env.ULTRA_SECRET;

export function getSHA256ofString(text: string) {
  return crypto.createHash("sha256").update(JSON.stringify(text)).digest("hex");
}
// Esto chequea el token y devuelve la data
export async function authMiddleware(req, res, next) {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    console.log({ token: token });
    try {
      const data = jwt.verify(token, SECRET);
      req.user = data;
      const finded = await Auth.findOne({ where: { id: req.user.id } });
      if (finded === null) {
        res.status(401).json("Token falso");
      } else {
        console.log("Token encontrado ",finded);
        next();
      }
    } catch (e) {
      console.log("err? ", e);
      res.status(401).json({ error: true });
    }
  } else {
    res.status(401).json({ error: "No has enviado ningún token" });
  }
}

// Crear usuario, chequear si ya existe, si existe enviar un aviso
export async function signUp(body) {
  const { email, password } = body;
  if (!email || !password) {
    return "Falta email y/o password";
  } else {
    const passwordHasheado = getSHA256ofString(password);
    // Primero User porque es el creador del id
    const [user, created] = await User.findOrCreate({
      where: { email: email },
      defaults: {
        email: email,
      },
    });
    if (created == false) {
      return "Email ya usado";
    } else if (created == true) {
      // Acá deberia seguír con el proceso de creación de cuenta
      const [auth, authCreated] = await Auth.findOrCreate({
        where: { email: email },
        defaults: {
          email: email,
          password: passwordHasheado,
          id: user.get("id"),
        },
      });
      if (authCreated == false) {
        return "Auth ya existente, chequear base de datos ya que no debería hacer así";
      } else if (authCreated == true) {
        console.log(
          "userAuthEmail: ",
          email,
          "passwordHasheado: ",
          passwordHasheado
        );
        // Una vez creado se le crea un token para que inicie sesión al mismo tiempo.
        return authToken(email, passwordHasheado);
      }
    }
  }
}
// Recibe email y contraseña y devuelve el token
export async function authToken(email, password) {
  const auth = await Auth.findOne({
    where: {
      email,
      password: password,
    },
  });
  console.log("auth: ", auth);
  if (auth) {
    const userData = await User.findOne({ where: { email: email } });
    const token = jwt.sign({ id: auth.get("id") }, SECRET);
    return {
      token: token,
      name: userData.get("name"),
      location: userData.get("location"),
    };
  } else {
    return "password o email incorrecta";
  }
}
