const fs = require('fs');

const saveAll = async (messages, output = './data.csv') => {
    if (fs.existsSync(output)) {
        await fs.appendFile(output, JSON.stringify(messages.map(item => Object.values(item))), (err) => {
            if (err) {
                console.error("Error writing file:", err);
            } else {
                // console.log("done ");
            }
        });
        console.error('Tệp tồn tại!');
    } else {
        if (Array.isArray(messages) && messages.length > 0) {
            const msg = messages[0]
            const listKey = Object.keys(msg)

            await fs.writeFile(output, JSON.stringify(listKey), (err) => {
                if (err) {
                    console.error("Error writing file:", err);
                } else {
                    // console.log("done ");
                }
            });
            await fs.appendFile(output, JSON.stringify(messages.map(item => Object.values(item))), (err) => {
                if (err) {
                    console.error("Error writing file:", err);
                } else {
                    // console.log("done ");
                }
            });
        }
    }

}
const save = async (message, output = './data.csv') => {
    try {
        return new Promise(async (resolve, reject) => {
            const header = Object.keys(message).join(',') + '\n';
            const content = Object.values(message)
                .map(item => (typeof item === 'object' ? JSON.stringify(item) : item)) // Chuyển object thành chuỗi JSON
                .join(',') + '\n';
            const isFileExists = await fs.existsSync(output)
            if (!isFileExists) {
                await fs.writeFile(output, header, (err) => {
                    if (err) {
                        reject(err)
                        console.error("Error writing file:", err);
                    } else {
                        // console.log("ok");
                    }
                });
            }
            await fs.appendFile(output, content, (err) => {
                if (err) {
                    console.error("Error writing file:", err);
                } else {
                    // console.log("ok");
                }
            });
            resolve(output)
        })

    } catch (err) {
        console.error('Lỗi khi lưu tệp:', err);
    }
};
const csvToJson = async (filePath = './data.csv', output = './data.json') => {
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const [headerLine, ...lines] = data.trim().split('\n');
        const headers = headerLine.split(',');

        const jsonData = lines.map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, i) => {
                // if (header == "msg") {
                //     obj[header] = JSON.parse(values[i]);
                //  }
                // else {
                //     obj[header] = values[i];
                // }
                obj[header] = values[i];
            });
            return obj;
        });

        await fs.promises.writeFile(output, JSON.stringify(jsonData, null, 2), 'utf-8');
        return jsonData;
    } catch (err) {
        console.error('❌ Lỗi khi đọc CSV hoặc ghi JSON:', err);
        return [];
    }
};

module.exports = { saveAll, save, csvToJson }