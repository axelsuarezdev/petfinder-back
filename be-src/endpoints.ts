import * as dotenv from "dotenv";
dotenv.config();
import * as bodyParser from "body-parser"
import * as cors from "cors";
import * as path from "path";
import {
  authMiddleware,
  signUp,
  getSHA256ofString,
  authToken,
} from "./controllers/auth-controller";
import {
  getAllUsers,
  deleteSpecificUser,
  modifyUserData,
  modfiyPassword,
} from "./controllers/users-controller";
import {deleteAllReports, getAllReports, updateReport,getMyReports, getNearbyPets, reportPublication} from "./controllers/pets-controller"
import * as express from "express"
import { sequelize } from "./sync";
const app = express();
const PORT = 5000;

sequelize.sync({ force: true});

// app.use(express.json());
// app.use(bodyParser.json());
app.use(cors({origin: 'http://127.0.0.1:8080/',
optionsSuccessStatus: 200,
}));
// Add access control allow origin headers
app.use((req, res, next)=>{
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:8080/");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Authorization"
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
})
// const staticDirPath = path.resolve(__dirname, "../fe-dist");

// app.use(express.static(staticDirPath));
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({limit: "100mb", extended: true}))
                                                                                              

/*-------------->USERS<--------------*/
// Eliminar usuario especifico
app.delete("/deleteSpecificUser/:userId", async (req, res) => {
  console.log("userId especificamente: ", req.params.userId);
  const deleteResponse = await deleteSpecificUser(req.params.userId);
  res.json(deleteResponse);
});

// Obtener todos los usuarios
app.get("/getAllUsers", async (req, res) => {
  let allUsersResponse = await getAllUsers();
  console.log(allUsersResponse)
  res.json({ allUsersResponse });
});

// Modificar datos personales
app.put("/modifyData", authMiddleware, async (req, res) => {
  const { newData } = req.body;
  console.log(req.user.id, req.body);
  if (!req.body) {
    res.json("Faltan datos en el body");
  } else {
    const response = await modifyUserData(req.user.id, req.body);
    res.json(response);
  }
});
app.put("/modifyPassword", authMiddleware, async (req, res) => {
  console.log(req.user.id, req.body);
  if (!req.body) {
    res.json("Faltan datos en el body");
  } else {
    const response = await modfiyPassword(req.user.id, req.body.newPassword);
    console.log({response})
    res.json(response);
  }
});
/*-------------->AUTH<--------------*/

// Iniciar sesión, recibe email y contraseña y devuelve token
app.post("/auth", async (req, res) => {
  const { email, password } = req.body;
  if (!req.body) {
    res.status(400).json("Falta body");
  } else if (!email || !password) {
    res.status(400).json("Faltan datos en el body");
  } else if (email && password) {
    const hashedPassword = getSHA256ofString(password);
    let response = await authToken(email, hashedPassword);
    res.json(response);
  }
});
// Esto es más para chequear el authMiddleWare
app.get("/auth/token", authMiddleware, async (req, res) => {
  res.json("Pasó");
});

//Crear un usuario
app.post("/createUser", async (req, res) => {
  if (!req.body) {
    res.status(400).json({ message: "Falta body" });
  } else {
    const signUpRes = await signUp(req.body);
    res.json(signUpRes);
  }
});



/*-------------->PETS<--------------*/
app.post("/reportPublication", authMiddleware, async (req,res)=>{
 
  console.log("/reportPublication recibió: ", req.body, "y ", req.user.id)
  if (!req.body){
    res.json("Faltan datos en el body");
  } else {
    const response = await reportPublication(req.body.reportData, req.user.id);
    console.log({response})
    res.json(response);
  }
}
);

app.put("/updateReport", authMiddleware, async (req,res)=>{
  console.log("/updateReport recibió: ", req.body, " y ",req.user.id)
  if (!req.body){
    res.json("Faltan datos en el body");
  } else{
    const response = await updateReport(req.body.reportData);
    console.log({response});
    res.json(response)
  }
})

app.get("/getMyReports", authMiddleware, async(req,res)=>{
  // Recibe la id del usuario que consulta,
  // Devuelve todos los reportes y su data
  const response = await getMyReports(req.user.id)
  console.log({response});
  res.json(response);
})
app.get("/getNearbyPets/:coords", authMiddleware, async (req, res)=>{
// Recibe coordenadas, y devuelve reportes dentro de cierta área
console.log(req.params.coords)
const response = await getNearbyPets(req.params.coords);
console.log({response})
res.json(response)
})

/*------->ADMIN<-------*/
app.get("/getAllReports", async (req,res)=>{
    const response = await getAllReports();
    res.json(response)
})

app.delete("/deleteAllReports", async (req,res)=>{
  const response= await deleteAllReports()
  res.json(response)
})


/*<---------------------------->*/
app.get("/check", (req, res)=>{
  res.send("OK");
});

app.listen(PORT, () => {
  console.log("API Running at", PORT);
});

// Combinación de back + front
// ubicación donde se deployea mi front
// app.get("*", (req, res) => {
//   res.sendFile(staticDirPath + "/index.html");
// });
