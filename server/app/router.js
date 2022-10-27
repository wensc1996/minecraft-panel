'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller, io } = app;
    router.get('/index', controller.home.index);
    router.post('/login',controller.login.login);
    router.post('/logout',controller.login.logout);

    router.post('/getLocationList', app.middleware.checkLoginStatusKeep(), controller.location.getLocationList);
    router.post('/addLocation', app.middleware.checkLoginStatusKeep(), controller.location.addLocation);
    router.post('/deleteLocation', app.middleware.checkLoginStatusKeep(), controller.location.deleteLocation);

    io.of('/').route('thread', io.controller.mcbridge.thread)
    
    router.post('/killProcess', app.middleware.checkLoginStatusKeep(), io.controller.mcbridge.killProcess);
    router.post('/beginProcess', app.middleware.checkLoginStatusKeep(), io.controller.mcbridge.beginProcess);
    router.get('/serverStatus', app.middleware.checkLoginStatusKeep(), io.controller.mcbridge.serverStatus);
    router.get('/getOnlinePlayerList', app.middleware.checkLoginStatusKeep(), io.controller.mcbridge.getOnlinePlayerList);

    router.post('/backupPlayer', app.middleware.checkLoginStatusKeep(), controller.playerFiles.backupPlayer);
    router.post('/restorePlayer', app.middleware.checkLoginStatusKeep(), controller.playerFiles.restorePlayer);
    router.post('/uploadFile', app.middleware.checkLoginStatusKeep(), controller.playerFiles.uploadFile);
    router.get('/getPlayerFileList', app.middleware.checkLoginStatusKeep(), controller.playerFiles.getPlayerFileList);
    router.post('/deletePlayer', app.middleware.checkLoginStatusKeep(), controller.playerFiles.deletePlayer);

    router.get('/getUserList', app.middleware.checkLoginStatusKeep(), controller.user.getUserList);
    router.post('/updatePassword', app.middleware.checkLoginStatusKeep(), controller.user.updatePassword);
    router.post('/deleteUser', app.middleware.checkLoginStatusKeep(), controller.user.deleteUser);
    router.post('/addNewUser', app.middleware.checkLoginStatusKeep(), controller.user.addNewUser);
    router.post('/updatePlayerId', app.middleware.checkLoginStatusKeep(), controller.user.updatePlayerId);

    router.post('/getRolePrivilege', app.middleware.checkLoginStatusKeep(), controller.privilege.getRolePrivilege);
    router.get('/getRoleList', app.middleware.checkLoginStatusKeep(), controller.privilege.getRoleList);
    router.get('/getPrivilegeList', app.middleware.checkLoginStatusKeep(), controller.privilege.getPrivilegeList);
    router.post('/updatePrivilege', app.middleware.checkLoginStatusKeep(), controller.privilege.updatePrivilege);
    

    router.get('/getGameDispose', app.middleware.checkLoginStatusKeep(), controller.dispose.getGameDispose);
    router.post('/updateGameDispose', app.middleware.checkLoginStatusKeep(), controller.dispose.updateGameDispose);

    router.post('/getDirectoryOrFile', app.middleware.checkLoginStatusKeep(), controller.directoryTree.getDirectoryOrFile)
    router.get('/download', app.middleware.checkLoginStatusKeep(), controller.directoryTree.download)
    router.post('/uploadFileToTargetDirec', app.middleware.checkLoginStatusKeep(), controller.directoryTree.uploadFileToTargetDirec)
    router.post('/deleteFileOrDirectory', app.middleware.checkLoginStatusKeep(), controller.directoryTree.deleteFileOrDirectory)
    router.post('/createNewDirectory', app.middleware.checkLoginStatusKeep(), controller.directoryTree.createNewDirectory)
    router.post('/renameDirectoryOrFile', app.middleware.checkLoginStatusKeep(), controller.directoryTree.renameDirectoryOrFile)

    router.post('/getLogList', app.middleware.checkLoginStatusKeep(), controller.logs.getLogList);
    router.post('/deleteLog', app.middleware.checkLoginStatusKeep(), controller.logs.deleteLog);
};
