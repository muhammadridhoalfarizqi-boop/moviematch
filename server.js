const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'Ridho',        
    password: '089524620042ridho',  
    database: 'moviematch_db'
});

db.connect((err) => {
    if (err) {
        console.error('Koneksi ke database MySQL gagal:', err);
        return;
    }
    console.log('Berhasil terhubung ke database MySQL.');
});

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.json({ success: false, message: 'Semua kolom harus diisi!' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(query, [name, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.json({ success: false, message: 'Email sudah terdaftar!' });
                }
                return res.json({ success: false, message: 'Terjadi kesalahan pada server.' });
            }
            res.json({ success: true, message: 'Registrasi berhasil!' });
        });
    } catch (error) {
        res.json({ success: false, message: 'Gagal memproses pendaftaran.' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: 'Email dan password harus diisi!' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.json({ success: false, message: 'Email atau password salah.' });
        }

        const user = results[0];
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Email atau password salah.' });
        }

        res.json({
            success: true,
            message: 'Login berhasil!',
            user: { id: user.id, name: user.name, email: user.email }
        });
    });
});

app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});