'use strict';

const mysqlModual = require('mysql');

// 数据库连接配置：优先读取环境变量，便于不同环境注入，避免明文密码写死在代码中
const baseConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'nsc9988893589',
    database: process.env.MYSQL_DATABASE || 'mcpanel',
    // 连接池上限，默认与 MySQL 端常用限制保持一个安全值
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 10,
};

// 每个 worker 进程内共享一个连接池（单例），彻底避免每条 SQL 新建/销毁 TCP 连接
const pool = mysqlModual.createPool(baseConfig);

pool.on('error', (err) => {
    console.error('[mysql-pool] 连接错误:', err);
});

// 统一封装：自动从池中取/还连接，并兼容无参数 SQL（避免 mysql 模块对空参数行为不一致）
function runQuery(connection, sql, params, cb) {
    if (params === undefined || params === null) {
        connection.query(sql, cb);
    } else {
        connection.query(sql, params, cb);
    }
}

/**
 * 执行单条 SQL，自动从连接池获取/归还连接
 * @param {string} sql
 * @param {Array|*} [params]
 * @returns {Promise<*>} results
 */
function query(sql, params) {
    return new Promise((resolve, reject) => {
        runQuery(pool, sql, params, (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
}

/**
 * 在同一数据库连接上按数组顺序执行多条 SQL，整体事务（任一失败回滚）
 * 数组项形如 { sql, params }
 * @param {Array<{sql: string, params?: Array|*}>} sqlTasks
 * @returns {Promise<void>}
 */
function transaction(sqlTasks) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) return reject(err);
            connection.beginTransaction((beginErr) => {
                if (beginErr) {
                    connection.release();
                    return reject(beginErr);
                }
                const runTask = (index) => {
                    if (index >= sqlTasks.length) {
                        connection.commit((commitErr) => {
                            connection.release();
                            if (commitErr) return reject(commitErr);
                            resolve();
                        });
                        return;
                    }
                    const task = sqlTasks[index];
                    runQuery(connection, task.sql, task.params, (queryErr) => {
                        if (queryErr) {
                            return connection.rollback(() => {
                                connection.release();
                                reject(queryErr);
                            });
                        }
                        runTask(index + 1);
                    });
                };
                runTask(0);
            });
        });
    });
}

// 进程优雅退出时回收连接池
function closePool() {
    return new Promise((resolve) => {
        pool.end(() => resolve());
    });
}

module.exports = {
    query,
    transaction,
    closePool,
    pool,
};
