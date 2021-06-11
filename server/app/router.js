'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller, io } = app;
    router.get('/index', controller.home.index);
    router.post('/login',controller.login.index);

    router.post('/getLocationList', controller.location.getLocationList);
    router.post('/addLocation', controller.location.addLocation);
    router.post('/deleteLocation', controller.location.deleteLocation);

    io.of('/').route('thread', io.controller.mcbridge.thread)
    
    router.post('/killProcess', io.controller.mcbridge.killProcess);
    router.post('/beginProcess', io.controller.mcbridge.beginProcess);
    router.get('/serverStatus', io.controller.mcbridge.serverStatus);
    router.get('/getOnlinePlayerList', io.controller.mcbridge.getOnlinePlayerList);

    router.post('/backupPlayer', controller.playerFiles.backupPlayer);
    router.post('/restorePlayer', controller.playerFiles.restorePlayer);
    router.post('/uploadFile', controller.playerFiles.uploadFile);

    router.get('/getUserList', controller.user.getUserList);
    router.post('/updatePassword', controller.user.updatePassword);
    router.post('/deleteUser', controller.user.deleteUser);
    router.post('/addNewUser', controller.user.addNewUser);

    router.get('/getPlayerList', controller.user.getPlayerList);
    router.post('/deletePlayer', controller.user.deletePlayer);
    router.post('/updatePlayerId', controller.user.updatePlayerId);

    router.post('/getRolePrivilege', controller.privilege.getRolePrivilege);
    router.get('/getRoleList', controller.privilege.getRoleList);
    router.get('/getPrivilegeList', controller.privilege.getPrivilegeList);
    router.post('/updatePrivilege', controller.privilege.updatePrivilege);

    router.get('/getGameDispose', controller.dispose.getGameDispose);
    router.post('/updateGameDispose', controller.dispose.updateGameDispose);

    router.post('/getDirectoryOrFile', controller.directoryTree.getDirectoryOrFile)
    router.get('/download', controller.directoryTree.download)
    router.post('/uploadFileToTargetDirec',controller.directoryTree.uploadFileToTargetDirec)
};
