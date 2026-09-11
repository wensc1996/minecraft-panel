const path = require('path');

// 实例名称清洗：仅保留中文、字母、数字（其余替换为下划线），并裁剪长度，作为目录名使用
function sanitizeInstanceName(name) {
    let s = (name || '').toString().trim()
        .replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
    return s.slice(0, 60);
}

// 校验实例名称：仅允许中文、字母、数字（非空）
function isValidInstanceName(name) {
    return typeof name === 'string' && name.trim().length > 0 && /^[\u4e00-\u9fa5A-Za-z0-9]+$/.test(name.trim());
}

// 由租户存储根目录 + 实例名称拼接出实例工作目录（不落库，按需计算）
function buildWorkPath(storagePath, name) {
    const dir = sanitizeInstanceName(name) || 'instance';
    return path.resolve(storagePath, dir);
}

module.exports = { sanitizeInstanceName, isValidInstanceName, buildWorkPath };
