const http = require("http");
const fs = require("fs").promises;
const path = require("path");

const SUCCESS = 200;
const SERVER_ERROR = 500;
const NOT_FOUND = 404;

const users = {};

const server = http.createServer(async (req, res) => {
    console.log(req.method, req.url);
    try {
        if (req.method === "GET") {
            if (req.url === "/"){
                const data = await fs.readFile("./index.html");
                res.writeHead(SUCCESS, {"Content-Type": "text/html; charset=utf-8"});
                res.end(data);
            } else if (req.url == "/about") {
                const data = await fs.readFile("./about.html");
                res.writeHead(SUCCESS, {"Content-Type": "text/html; charset=utf-8"});
                res.end(data);  
            } else if (req.url == "/user") {   
                res.writeHead(SUCCESS, {"Content-Type": "text/plain; charset=utf-8"});
                res.end(JSON.stringify(users));
            } else if(req.url.startsWith("/static/")) {
                const filePath = "." + req.url;
                const data = await fs.readFile(filePath);
                const contentType = getContentType(filePath);
                res.writeHead(200, {"Content-Type": contentType});
                res.end(data);
            } else if (imageMatch = req.url.match(/^\/images\/(.+)$/)) { 
                const imageName = imageMatch[1];
                const imagePath = "./images/" + imageName;
                try {    
                    const contentType = getContentType(imagePath);
                    const data = await fs.readFile(imagePath);
                    res.writeHead(SUCCESS, {"ContentType": contentType});
                    res.end(data);
                } catch (err) {
                    res.writeHead(NOT_FOUND, {"Content-Type": "text/plain; charset=utf-8"});
                    res.end("Not Found");
                }
            } else {
                res.writeHead(NOT_FOUND, {"Content-Type": "text/plain; charset=utf-8"});
                res.end("Not Found");
            }
        } else if (req.method === "POST") {
            if(req.url === "/user") {
                // 요청을 생성할 때
                // 요청 request를 파싱해서 처리
                let body = "";
                req.on("data", (data) => { body += data });
                req.on("end", () => {
                    // 객체 형태로 담기
                    // console.log("요청온 내용은??", body);
                    // const formData = JSON.parse(body);
                    // const username = formData.name;
                    // users[username] = {
                    //     "Name" : username,
                    //     "ID": Date.now()
                    // }
                    // console.log(users);
                    console.log("요청온 내용은??", body);
                    const formData = JSON.parse(body);
                    const username = formData.name;

                    const ID = Date.now();
                    users[ID] = username;
                    console.log(users);
                });
                // 결과 response 주는 코드
                res.writeHead(201, {"Content-Type": "text/plain; charset=utf-8"});
                res.end("등록 성공");
            } else{
                res.writeHead(NOT_FOUND, {"Content-Type": "text/plain; charset=utf-8"});
                res.end("Not Found");
            }
            
        } else if (req.method === "PUT") {
            // 요청을 수정할 때
            if (req.url.startsWith("/user/")) {
                const key = req.url.split("/")[2];
                let body = "";
                req.on("data", (data) => {
                    body += data;
                });
                req.on("end", () => {
                    console.log("PUT Body: ", body);
                    const formData = parse(body);
                    users[key] = formData.name;
                    console.log(users);
                })
            }
            res.writeHead(201, {"Content-Type": "text/plain; charset=utf-8"});
            res.end("수정 성공");
        } else if (req.method === "DELETE") {
            // 요청을 삭제할 때
            if (req.url.startsWith("/user")){
                const key = req.url.split('/')[2];
                delete users[key];
                try {
                res.writeHead(201, {"Content-Type": "text/plain; charset=utf-8"});
                res.end(JSON.stringify(users));
                } catch (error) {
                    console.error("삭제 중 오류 발생", error);
                    res.writeHead(500, {"Content-Type": "text/plain; charset=utf-8"});
                    res.end("서버에서 알수없는 오류가 발생하여 삭제에 실패했습니다.");
                }
            } else {
                res.writeHead(NOT_FOUND, {"Content-Type": "text/plain; charset=utf-8"});
                res.end("Not Found");
            }
        }
    } catch(err) {
        console.error(err);
        res.write(SERVER_ERROR, {"Content-Type": "text/plain; charset-utf-8"});
        res.end("서버 오류");
    }
});

const port = 3000;
server.listen(port, () => {
    console.log(`${port}번 포트 열려있음`);
})

function getContentType(filePath) {
    const extname = path.extname(filePath);
    console.log(extname);
    switch (extname) {
        case ".html":
            return "text/html; charset=utf-8";
        case ".js":
            return "application/javascript; charset=utf-8";
        case ".jpg":
            return "images/jpeg; charset=utf-8";
        default:
            return "application/octet-stream";
    }
}