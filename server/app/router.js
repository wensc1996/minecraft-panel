'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller, io } = app;
    router.get('/index', controller.home.index);
    router.post('/login',controller.login.login);
    router.post('/logout',controller.login.logout);

    router.post('/getLocationList', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.location.getLocationList);
    router.post('/addLocation', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.location.addLocation);
    router.post('/deleteLocation', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.location.deleteLocation);
    
    io.of('/').route('joinRoom', io.controller.mcbridge.joinRoom)
    io.of('/').route('thread', io.controller.mcbridge.thread)
    
    router.post('/killProcess', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), io.controller.mcbridge.killProcess);
    router.post('/beginProcess', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), io.controller.mcbridge.beginProcess);
    router.get('/serverStatus', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), io.controller.mcbridge.serverStatus);
    router.get('/getOnlinePlayerList', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), io.controller.mcbridge.getOnlinePlayerList);

    router.post('/backupPlayer', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.playerFiles.backupPlayer);
    router.post('/restorePlayer', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.playerFiles.restorePlayer);
    router.post('/uploadFile', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.playerFiles.uploadFile);
    router.get('/getPlayerFileList', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.playerFiles.getPlayerFileList);
    router.post('/deletePlayer', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.playerFiles.deletePlayer);

    router.get('/getUserList', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.user.getUserList);
    router.post('/updatePassword', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.user.updatePassword);
    router.post('/deleteUser', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.user.deleteUser);
    router.post('/addNewUser', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.user.addNewUser);
    router.post('/updatePlayerId', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.user.updatePlayerId);
    router.post('/updateSelfPassword', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.user.updateSelfPassword);
    router.post('/updateSelfPlayerId', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.user.updateSelfPlayerId);

    router.post('/getRolePrivilege', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.privilege.getRolePrivilege);
    router.get('/getRoleList', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.privilege.getRoleList);
    router.get('/getPrivilegeList', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.privilege.getPrivilegeList);
    router.post('/updatePrivilege', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.privilege.updatePrivilege);
    router.post('/createRole', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.privilege.createRole);
    router.post('/deleteRole', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.privilege.deleteRole);
    

    router.post('/getGameDispose', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dispose.getGameDispose);
    router.post('/updateGameDispose', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dispose.updateGameDispose);

    // M3 实例配置历史快照：按租户隔离，切换历史配置回填表单
    router.post('/disposeHistory/list', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dispose.getDisposeHistoryList);
    router.post('/disposeHistory/detail', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dispose.getDisposeHistoryDetail);
    router.post('/disposeHistory/delete', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dispose.deleteDisposeHistory);

    router.post('/getDirectoryOrFile', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.directoryTree.getDirectoryOrFile)
    router.get('/download', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.directoryTree.download)
    router.post('/uploadFileToTargetDirec', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.directoryTree.uploadFileToTargetDirec)
    router.post('/deleteFileOrDirectory', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.directoryTree.deleteFileOrDirectory)
    router.post('/createNewDirectory', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.directoryTree.createNewDirectory)
    router.post('/renameDirectoryOrFile', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.directoryTree.renameDirectoryOrFile)
    router.post('/packageDownload', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.directoryTree.packageDownload)
    router.post('/extractZip', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.directoryTree.extractZip)
    router.post('/readFile', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.directoryTree.readFile)
    router.post('/writeFile', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.directoryTree.writeFile)

    router.post('/getLogList', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.logs.getLogList);
    router.post('/deleteLog', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.logs.deleteLog);

    // M4 平台管理后台：仅平台管理员(tenant_id=0)可调用，service 内再次校验
    router.get('/tenants', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.tenant.getTenantList);
    router.get('/dashboard', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.tenant.getDashboard);
    router.post('/updateTenantStatus', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.tenant.updateTenantStatus);
    router.post('/switchTenant', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.tenant.switchTenant);
    router.post('/addTenant', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.tenant.addTenant);
    router.post('/updateTenant', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.tenant.updateTenant);

    // M3 服务器实例配置 CRUD（按 tenant_id + instance_id 隔离）
    router.get('/server-instances', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dispose.getInstanceList);
    router.post('/addInstance', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dispose.addInstance);
    router.post('/deleteInstance', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dispose.deleteInstance);

    // M5 平台级字典表（存储历史 java 路径等可扩展配置，无租户隔离）
    router.post('/dict/list', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dict.listDict);
    router.post('/dict/add', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dict.addDict);
    router.post('/dict/update', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dict.updateDict);
    router.post('/dict/delete', app.middleware.checkLoginStatusKeep(), app.middleware.tenant(), controller.dict.deleteDict);
};
