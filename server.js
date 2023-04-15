import cookieParser from 'cookie-parser';
import express, { urlencoded } from 'express';
import mongoose from 'mongoose'
import path from 'path'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';



const app = express();
const port = process.env.PORT || 3000;
const pathName = path.resolve();
app.use('/css', express.static(path.join(pathName, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(pathName, 'node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(pathName, 'node_modules/jquery/dist')));

app.set('view engine', 'ejs');

// express.static() is a middleware
app.use(express.static(path.join(pathName, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const URL="mongodb://127.0.0.1:27017"
mongoose.connect(URL, {
    dbName: "backend",
}).then(() => console.log("successfully connected"))
    .catch(e => console.log(e));


const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
})



const User = mongoose.model('user', userSchema);


const isAuthenticated = async  (req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        const decoded = jwt.verify(token, 'secretcode');
        req.user = await User.findById(decoded._id);
        next();
    } else {
        res.redirect('/login');
    }
}


app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/', isAuthenticated, (req, res) => {
    res.render('logout', { name: req.user.name });

}
)

app.get('/register', (req, res) => {
    res.render('register');
})




app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user)
    {
        return res.redirect('/login');
    }

    const incryptedPassword = await bcrypt.hash(password, 10);
    
  user= await User.create({
        name,
      email,
        password:incryptedPassword,
  })
   const token = jwt.sign({ _id: user._id }, 'secretcode');
    
    res.cookie('token', token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000)
    });
    res.redirect('/');
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
       return res.redirect('/register');
    }
    const passwordMatched = await bcrypt.compare(password, user.password);
    console.log(passwordMatched);
        if ( !passwordMatched )
            return res.render('login', { email, message: "wrong password" });
            const token = jwt.sign({ _id: user._id }, 'secretcode');
            console.log(token);
             
             res.cookie('token', token, {
                 httpOnly: true,
                 expires: new Date(Date.now() + 60 * 1000)
             });
    
             res.redirect('/');
        
})




app.get('/logout', (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(Date.now())
    });
    res.redirect('/');
})
app.listen(port, () => console.log("server started"));