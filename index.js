const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pwls9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');
       
       
        //services api setup
        app.get('/service', async(req, res) =>{
            const query ={};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })

        app.get('/available', async(req, res) =>{
            const date = req.query.date;

            //get all services
            const services = await servicesCollection.find().toArray();

            const query ={date: date};
            const bookings = await bookingCollection.find(query).toArray();

            services.forEach(service =>{
                const serviceBooking = bookings.filter(book => book.treatment === service.name);
                const bookedSlots = serviceBooking.map(book => book.slot);
                const available = service.slots.filter(slot=> !bookedSlots.includes(slot))
                service.slots=available;
            })


            res.send(services)
        })

        app.get('/booking', async(req, res) =>{
            const patient =req.query.patient;
            const query ={patient: patient};
            const booking = await bookingCollection.find(query).toArray();
            res.send(booking);
        })

        app.post('/booking', async(req, res) =>{
            const booking = req.body;
            const query = {treatment: booking.treatment, date:booking.date, patient:booking.patient};
            const exist = await bookingCollection.findOne(query);
            if(exist){
                return res.send({success: false, booking: exist})
            }
            const result = await bookingCollection.insertOne(booking);
           return res.send({success:true, result})
        })

    }
    finally {

    }
}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Doctor app listening on port ${port}`)
})