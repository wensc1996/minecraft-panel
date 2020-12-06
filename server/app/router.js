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

    router.post('/backupPlayer', controller.playerFiles.backupPlayer);
    router.post('/restorePlayer', controller.playerFiles.restorePlayer);
    router.post('/uploadFile', controller.playerFiles.uploadFile);

    router.get('/getUserList', controller.user.getUserList);
    router.post('/updatePassword', controller.user.updatePassword);
    router.post('/deleteUser', controller.user.deleteUser);
    router.post('/addNewUser', controller.user.addNewUser);

    router.get('/getPlayerList', controller.user.getPlayerList);
    router.post('/deletePlayer', controller.user.deletePlayer);

    router.post('/getRolePrivilege', controller.privilege.getRolePrivilege);
    router.get('/getRoleList', controller.privilege.getRoleList);
    router.get('/getPrivilegeList', controller.privilege.getPrivilegeList);
    router.post('/updatePrivilege', controller.privilege.updatePrivilege);
};
