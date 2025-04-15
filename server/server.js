// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const { save, csvToJson } = require('./csv-helper');
const csvParser = require('csv-parser');

// Cấu hình Express và Socket.IO
const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const io = socketIo(server);

// Đường dẫn đến file CSV và JSON
const logFilePath = 'logs.csv';
const jsonFilePath = 'logs.json';

// Tạo CSV writer
const csvWriter = createObjectCsvWriter({
    path: logFilePath,
    header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'action', title: 'Action' },
        { id: 'msg', title: 'msg' },
    ],
    append: true, // Nếu file đã tồn tại, append thêm dữ liệu mới
});

// Kiểm tra và tạo file CSV nếu chưa tồn tại
// const initializeCsvFile = () => {
//     if (!fs.existsSync(logFilePath)) {
//         // Nếu file CSV chưa tồn tại, tạo file với tiêu đề cột
//         csvWriter.writeRecords([])  // Tạo file với tiêu đề cột
//             .then(() => {
//                 console.log('CSV file created with headers');
//             })
//             .catch((err) => console.error('Error creating CSV file', err));
//     }
// };

// Đọc file CSV và chuyển sang JSON
const convertCsvToJson = (csvFilePath) => {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on('data', (data) => {
                // Đảm bảo rằng các trường có tên rõ ràng
                console.log('convertCsvToJson', data)
                const logData = {
                    timestamp: data.Timestamp,
                    action: data.Action,
                    msg: JSON.parse(data.msg ?? '[]')
                };
                results.push(logData);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (err) => reject(err));
    });
};

// Ghi log và cập nhật JSON
// const updateJsonFile = async () => {
//     try {
//         const logsJson = await convertCsvToJson(logFilePath);
//         // Nếu file không tồn tại, tạo file mới
//         if (!fs.existsSync(jsonFilePath)) {
//             fs.writeFileSync(jsonFilePath, JSON.stringify([], null, 2));
//         }

//         fs.writeFileSync(jsonFilePath, JSON.stringify(logsJson, null, 2)); // Ghi đè dữ liệu
//         // console.log('JSON file updated');
//     } catch (err) {
//         console.error('Error converting CSV to JSON:', err);
//     }
// };


// Xử lý kết nối Socket.IO
io.on('connection', (socket) => {
    // console.log('+1 connected');

    // Lắng nghe sự kiện "log" từ client
    socket.on('log', (data) => {
        // await initializeCsvFile()
        // Log vào console
        io.emit('log', data);
        console.log(data);

        // Ghi vào file CSV
        const logData = {
            timestamp: data.timestamp,
            action: data.action,
            msg: data.msg,
        };
        save(logData, logFilePath).then(() => {
            csvToJson(logFilePath, jsonFilePath)
        })
    });

    socket.on('disconnect', () => {
        // console.log('User disconnected');
    });
});

app.get('/logs', (req, res) => {
    if (!fs.existsSync(jsonFilePath)) return res.json({ msg: "khoong co: " + jsonFilePath });
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read JSON log file:', err);
            return res.status(500).json({ error: 'Failed to read log file' });
        }

        try {
            let logs = JSON.parse(data);
            if (req.query.sort == 1) {
                logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
            if (req.query.pare == 1) {
                logs = logs.map(i => ({ ...i, msg: JSON.parse(i.msg) }))
            }
            res.json(logs);
        } catch (parseError) {
            console.error('Failed to parse log file:', parseError);
            res.status(500).json({ error: 'Invalid JSON format in log file' });
        }
    });
});

// Khởi động server
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    // initializeCsvFile();  // Khởi tạo CSV file khi server bắt đầu
});
