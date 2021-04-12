const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const fs= require('fs-extra');//fs: file system 
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
require('dotenv').config();

//dpu
//d1p2u3valo
const uri = `mongodb+srv://${process.env.REACT_APP_DB_USER}:${process.env.REACT_APP_DB_PASS}@cluster0.pjygh.mongodb.net/${process.env.REACT_APP_DB_NAME}?retryWrites=true&w=majority`;

console.log(process.env.REACT_APP_PORT);



const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('doctors'));
app.use(fileUpload())

const port = 5000;

app.get('/', function (req, res) {
    res.send('hello world')
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect((err) => {
    const appointmentsCollection = client.db("doctorsPortal").collection("appointments");
    const doctorCollection = client.db("doctorsPortal").collection("doctors");
    console.log('db connection successfully');





    app.post('/appointmentsAdd', (req, res) => {
        const newAppointment = req.body;
        // console.log(newAppointment);

        appointmentsCollection.insertOne(newAppointment)
            .then(result => {
                console.log(result);
                res.send(result.insertedCount > 0);
            })
    })



    app.post('/appointmentsByDate', (req, res) => {
        const date = req.body;
        // kebolDate=date.date;
        // console.log(kebolDate);
       
        const email=req.body.email;//email diye appointments dekhar jonno only for doctors

        doctorCollection.find({ email: email })
        .toArray((err, doctors) => {
            const filter={date: date.date}

            if(doctors.length===0){
                filter.email=email;
            }
            
            appointmentsCollection.find(filter)
            .toArray((err, documents) => {
                res.send(documents);
            })
        })
    })







    app.get('/appointments', (req, res) => {
        appointmentsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })







    //To add a doctor to the server(files uploading special submit)
    app.post('/addADoctor', (req, res) => {

        const file = req.files.file;//req.files theke file nilam
        const name = req.body.name;//req.body theke name nilam
        const email = req.body.email;//req.body theke email nilam

        console.log(file, name, email);
        
        // Method-1: locally save image
        //saving the image coming with files to 'doctors' directory & show them in the website
        const filePath =`${__dirname}/doctors/${file.name}`;

        // file.mv(filePath, err => {
        // //if error occured
        // if (err) {
        //     console.log(err);
        //     res.status(500).send({msg:'Failed to upload image'})
        // }
        // //if successfully saved
        // return res.send({ name: file.name, path: `/${file.name}` })
        // })

        //saved to 'doctors' directory


        //Method-2: saving image to mongodb database
        const newImg = file.data;
        const encImg= newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')//warning gone after using 'from'
        };

        doctorCollection.insertOne({ name, email, image })
            .then(result => {

                //as we are uploading to the database, no need to save it into 'doctors' folder.
                // fs.remove(filePath,error=>{
                // if(error)
                // {
                // console.log(error);
                // res.status(500).send({msg:'Failed to upload image'})
                // }
                //if successful
                res.send(result.insertedCount > 0);
                })
                
            // })
    })



    //To get the doctor in the client side
    app.get('/doctors', (req, res) => {
        doctorCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });





    //To check whether a person is doctor or not. Use in Sidebar
    app.post('/isDoctor', (req, res) => {
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                res.send(doctors.length > 0);
            })
    })




});//client.connect


app.listen(process.env.REACT_APP_PORT|| port)