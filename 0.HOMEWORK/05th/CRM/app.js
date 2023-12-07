const express = require('express');
const nunjucks = require('nunjucks');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const dbFile = "mydb.db";

const db = new sqlite3.Database(dbFile);

// nunjucks 설정
const viewDir = path.join(__dirname, "views");
const publicDir = path.join(__dirname, "public");

nunjucks.configure(viewDir, {
    express: app,
    watch: true
})
app.set("view engine", "html");

// // express.js 정적 파일 제공 설정
// app.use(express.static("public"));
// express.js 정적 파일 제공 설정
app.use(express.static(publicDir));

// DB 초기화
function init_database() {
    // 테이블 유무 검토할 데이터
    const tablesToCheck = ["user", "store", "item", "order", "orderItem"];

    const checkTableQuery = "SELECT name FROM sqlite_master WHERE type='table' AND name=?";

    const createTable = () => {
        // 초기화 스크립트
        const sql = fs.readFileSync(path.join(__dirname, 'init_database.sql'), 'utf8');

        db.exec(sql, (initErr) => {
            if (initErr) {
                console.log("DB 초기화 실패:", initErr);
            } else {
                console.log("초기화 성공");
            }
        });
    };

    const checkNextTable = (index) => {
        if (index < tablesToCheck.length) {
            const tableName = tablesToCheck[index];

            db.get(checkTableQuery, [tableName], (err, row) => {
                if(err) {
                    console.log(`테이블 ${tableName} 확인중 에러 발생`);
                    return;
                }

                if (!row) {
                    console.log(`테이블 ${tableName}이 존재하지 않습니다.`);
                    createTable();
                } else {
                    console.log(`테이블 ${tableName}이 이미 존재합니다.`);
                    checkNextTable(index + 1);
                }
            });
        } else {
            // 모든 테이블 확인 완료
            console.log(`모든 테이블 확인 완료.`);
        }
    };

    // 첫 번째 테이블 확인 시작
    checkNextTable(0);
}

    // 초기화(기본)
    // const sql = fs.readFileSync(path.join(__dirname, 'init_database.sql'), 'utf8');

    // console.log("경로", path.join(__dirname, 'init_database.sql'));
    // db.exec(sql, (err) => {
    //     if (err) {
    //         console.log("DB 초기화 실패", err);
    //     } else {
    //         console.log("초기화 성공");
    //     }
    // })

init_database();

// 라우터
app.get('/', (req, res) => {
    res.render('index', { title: "미니샵 관리화면", message: " 관리자 화면 " });
})

const itemPerPage = 20;

// user 통해 사용자 리스트 출력
app.get('/user', (req, res) => {
    //페이지 번호 가져오기
    const page = parseInt(req.query.page) || 1;

    // 사용자 정보 itemPerpage 만큼씩 나눠서 페이지 출력
    // const offset = (page - 1) * itemPerPage;
    const offset = (page - 1) * itemPerPage;
    const query = `SELECT * FROM user LIMIT ${itemPerPage} OFFSET ${offset}`;

    // 전체 사용자수 카운트
    const countQuery = 'SELECT count(*) FROM user';

    db.all(query, (err, rows) => {
        if (err) {
            console.log("사용자 데이타 출력 실패:", err);
            res.status(500).json({ error: 'Database error'});
        } else {
            db.get(countQuery, (countErr, countRow) => {
                if (countErr) {
                    console.log('전체 사용자수 조회실패 : ', countErr);
                    res.status(500).json({error: "Database Error"});
                } else {
                    const totalUsers = countRow.total;
                    const totalPages = Math.ceil(totalUsers / itemPerPage);
                    console.log(totalUsers, totalPages, itemPerPage);

                    const data = {
                        title: "사용자 리스트",
                        message: "사용자 리스트 + 검색",
                        users: rows,
                        // 페이지 수에 맞게 총 페이지 계산해 출력하기
                        totalPages: totalPages
                    };
                    console.log('사용자 총페이지수', totalPages);
                    res.render('user', data);
                }
            });            
        }
    });
});

// store 로 매장 리스트 출력
app.get('/store', (req, res) => {
    // 페이지 번호 가져오기
    const page = req.query.page || 1;

    // 매장 정보 itemPerPage 만큼씩 나눠서 페이지 출력
    const offset = (page - 1) * itemPerPage;
    const query = `SELECT * FROM store LIMIT ${itemPerPage} OFFSET ${offset}`;

    // 전체 매장수 카운트
    const countQuery = 'SELECT count(*) FROM store';
    
    db.all(query, (err, rows) => {
        if (err) {
            console.log("매장 데이타 출력 실패");
            res.status(500).json({ error: 'Database error'});
        } else {
            db.get(countQuery, (countErr, countRow) => {
                if (countErr) {
                    res.status(500).json({ error: "Database Count Error "});
                } else {
                    const totalStores = countRow.total;
                    const totalPages = Math.ceil(totalStores / itemPerPage);
                    console.log(totalStores, totalPages, itemPerPage);

                    const data = {
                        title: "매장 리스트",
                        message: "매장 리스트 + 검색",
                        stores: rows,
                        totalPages: totalPages
                    }
                    console.log("정리된 매장 데이터 : ", data);
                    res.render('store', data);
                }
            });
        }
    });
});

// item 으로 상품 리스트 출력
app.get('/item', (req, res) => {
    // 페이지 번호 가져오기
    const page = req.query.page || 1;

    // 상품 정보 itemPerPage 만큼씩 나눠서 페이지 출력
    const offset = (page - 1) * itemPerPage;
    const query = `SELECT * FROM item LIMIT ${itemPerPage} OFFSET ${offset}`;

    // 전체 상품수 카운트
    const countQuery = "SELECT count(*) FROM item";

    db.all(query, (err, rows) => {
        if (err) {
            console.log("매장 데이타 출력 실패");
            res.status(500).json({ error: "Database Error "});
        } else {
            db.get(countQuery, (countErr, countRow) => {
                if (countErr) {
                    res.status(500).json({ error: "Database Count Error"});
                } else {
                    const totalItems = countRow.total;
                    const totalPages = Math.ceil(totalItems / itemPerPage);
                    console.log(totalItems, totalPages, itemPerPage);

                    const data = {
                        title: "상품 리스트",
                        message: "상품 리스트",
                        items: rows,
                        totalPages: totalPages
                    }
                    console.log("상품 데이타 총페이지 : ", totalPages);
                    res.render('item', data);
                }
            });
        }
    });
});

// order 로 주문 리스트 출력
app.get('/order', (req, res) => {
    // 페이지 번호 가져오기
    const page = req.query.page || 1;
    
    // 주문 정보 itemPerPage 만큼씩 나눠서 페이지 출력
    const offset = (page - 1) * itemPerPage;
    const query = "SELECT * FROM 'order' LIMIT ? OFFSET ?";

    // 전체 주문수 카운트
    const countQuery = "SELECT count(*) FROM `order`";

    db.all(query, [itemPerPage, offset], (err, rows) => {
        if (err) {
            console.log("주문 데이타 출력 실패");
            res.status(500).json({ error: "Database error"});
        } else {
            db.get(countQuery, (countErr, countRow) => {
                if (countErr) {
                    res.status(500).json({ error: "Database Count Error"});
                } else {
                    const totalOrders = countRow.total;
                    const totalPages = Math.ceil(totalOrders / itemPerPage);
                    console.log(totalOrders, totalPages, itemPerPage);

                    const data = {
                        title: "주문 리스트",
                        message: "주문 리스트 + 검색",
                        orders: rows,
                        totalPages: totalPages
                    }
                    res.render('order', data);
                }
            });            
        }
    });
});

// orderItem 으로 주문상품 리스트 출력
app.get('/orderItem', (req, res) => {
    // 페이지 번호
    const page = req.query.page || 1;

    // 주문 상품 itemPerPage 만큼씩 나눠서 페이지 출력
    const offset = (page -1) * itemPerPage;
    const query = "SELECT * FROM `orderItem` LIMIT ? OFFSET ?";
    
    // 전체 주문상품 카운트
    const countQuery = "SELECT count(*) FROM `orderItem`";

    db.all(query, [itemPerPage, offset], (err, rows) => {
        if (err) {
            console.log("주문 상품 리스트 데이타 출력 실패");
            res.status(500).json({ error: "Database error"});
        } else {
            db.get(countQuery, (countErr, countRow) => {
                if (countErr) {
                    res.status(500).json({ error: "Database count Error"});
                } else {
                    const totalOrderItems = countRow.total;
                    const totalPages = Math.ceil(totalOrderItems / itemPerPage);
                    console.log(totalOrderItems, totalPages, itemPerPage);

                    const data = {
                        title: "주문 상품 리스트",
                        message: "주문 상품 리스트 + 검색",
                        orderItems: rows,
                        totalPages: totalPages
                    }
                    res.render('orderItem', data);
                }
            });
        }
    });
});
// app.get('/orderItem', (req, res) => {
//     const data = {
//         title: "주문상품 리스트",
//         message: "주문상품 리스트 + 검색"
//     }
//     res.render('orderItem', data);
// })

// 서버실행
app.listen(port, () => {
    console.log(`포트 ${port}이 실행 중`);
});