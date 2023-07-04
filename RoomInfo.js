const _ = require('lodash')
const communicationConstants = require('../photon/constants/CommunicationCodes')
const User = require("../models/User");

const UserStates = {
  Default: "default",
  LoadingVR: "loadingVR",
  LoadingViewer: "loadingViewer",
  InRoomVR: "inRoomVR",
  InRoomViewer: "inRoomViewer"
};

class BasicRoomInfo {
  constructor(
    creatorName,
    title,
    agenda,
    roomId,
    creationDate,
    roomLinkId,
    client,
    teamId,
    password = null
  ) {
    this.creatorName = creatorName;
    this.title = title;
    this.agenda = agenda;
    this.roomId = roomId;
    this.roomLinkId = roomLinkId;
    this.client = client;
    this.teamId = teamId;
    this.creationDate = creationDate;
    this.password = password;
  }
}

class OpenRoomInfo extends BasicRoomInfo {
  constructor(
    hasProfilePic,
    creatorName,
    title,
    agenda,
    roomId,
    creationDate,
    gameServerAddress,
    users,
    environment,
    roomLinkId,
    roomLoaded,
    password = null,
    client,
    teamId,
    stateViewer = "default",
    stateVR = "default",
    userDeviceTypes,
    nonActiveUsers,
    usersRoles
  ) {
    super(
      creatorName,
      title,
      agenda,
      roomId,
      creationDate,
      roomLinkId,
      client,
      teamId,
      password,
      userDeviceTypes,
      nonActiveUsers,
      usersRoles
    );
    this.hasProfilePic = hasProfilePic;
    this.gameServerAddress = gameServerAddress;
    this.stateVR = stateVR;
    this.stateViewer = stateViewer;
    this.members = users;
    this.environment = environment;
    this.roomLoaded = roomLoaded;
    this.userDeviceTypes = userDeviceTypes
    this.nonActiveUsers = nonActiveUsers
    this.usersRoles = usersRoles

  }

  static async updateOpenRoomsList(
    openRoomList,
    response,
    isGuest = false,
    client
  ) {
    if (Object.keys(response).length !== 0) {
      let data = response;
      for (let key in data) {
        let roomProperties = data[key];
        let removeRoom = false;
        let newRoom = !_.find(openRoomList, room => { return room.roomId === key; });
        let creationObject = {client};
        for (let propertyKey in roomProperties) {
          switch (propertyKey) {
            case "" + communicationConstants.GameParameter.CreatorUserName:
              creationObject.creatorName =
                roomProperties[communicationConstants.GameParameter.CreatorUserName];
              break;
            case "" + communicationConstants.GameParameter.Title:
              creationObject.title = roomProperties[communicationConstants.GameParameter.Title];
              break;
            case "" + communicationConstants.GameParameter.Agenda:
              creationObject.agenda = roomProperties[communicationConstants.GameParameter.Agenda];
              break;
            case "" + communicationConstants.GameParameter.SavedRoomLinkId:
              creationObject.roomLinkId =
                roomProperties[communicationConstants.GameParameter.SavedRoomLinkId];
              break;
            case "" + communicationConstants.GameParameter.UdpAddress:
              creationObject.gameServerAddress =
                roomProperties[communicationConstants.GameParameter.UdpAddress];
              break;
            case "" + communicationConstants.GameParameter.CreationTimeUTC:
              creationObject.creationDate =
                roomProperties[communicationConstants.GameParameter.CreationTimeUTC];
              break;
            case "" + communicationConstants.GameParameter.ActiveUser:
              creationObject.activeUsers =
                roomProperties[communicationConstants.GameParameter.ActiveUser];
              break;
            case "" + communicationConstants.GameParameter.UserDeviceType:
              creationObject.userDeviceTypes =
                roomProperties[communicationConstants.GameParameter.UserDeviceType];
              break;
            case "" + communicationConstants.GameParameter.Removed:
              removeRoom = roomProperties[communicationConstants.GameParameter.Removed];
              break;
            case "Removed":
              removeRoom = roomProperties["Removed"];
              break;
            case "" + communicationConstants.GameParameter.RoomEnvironment:
              creationObject.environment =
                roomProperties[communicationConstants.GameParameter.RoomEnvironment];
              break;
            case "" + communicationConstants.GameParameter.Password:
              creationObject.password = roomProperties[communicationConstants.GameParameter.Password];
              break;
            case "" + communicationConstants.GameParameter.RoomLoaded:
              creationObject.roomLoaded =
                roomProperties[communicationConstants.GameParameter.RoomLoaded];
              break;
            case "" + communicationConstants.GameParameter.TeamId:
              creationObject.teamId =
                roomProperties[communicationConstants.GameParameter.TeamId];
              break;
            case "" + communicationConstants.GameParameter.NonActiveUsers:
              creationObject.nonActiveUsers =
                roomProperties[communicationConstants.GameParameter.NonActiveUsers];
              break;
            case "" + communicationConstants.GameParameter.UsersRoles:
              creationObject.usersRoles =
                roomProperties[communicationConstants.GameParameter.UsersRoles];
              break;
            default:
              break;
          }
        }
        if (removeRoom) {
          _.remove(openRoomList, room => { return room.roomId === key; });
        } else {
          try {
            
            let users = creationObject.activeUsers && creationObject.activeUsers.length > 0
              ? await User.find({ _id: creationObject.activeUsers }).select('first_name email picExtension last_name profilePic') : [];

            const nonActiveUsersList = await User.mapNonInvitedUsers(User, creationObject.nonActiveUsers);
            if (users && users.length) {
              for (let user of users) {
                user.initials = user.first_name.charAt(0) + user.last_name.charAt(0);
              }
            }

            if (newRoom) {
              console.log('in newRoom')
              
              let stateVR = "default";
              let stateViewer = "default";
              creationObject.roomLinkId = creationObject.roomLinkId ? creationObject.roomLinkId : key;
              const roomObj = new OpenRoomInfo(
                false,
                creationObject.creatorName,
                creationObject.title,
                creationObject.agenda,
                key,
                creationObject.creationDate,
                creationObject.gameServerAddress,
                users,
                creationObject.environment,
                creationObject.roomLinkId,
                creationObject.roomLoaded,
                creationObject.password,
                creationObject.client,
                creationObject.teamId,
                stateVR,
                stateViewer,
                creationObject.userDeviceTypes,
                nonActiveUsersList,
                creationObject.usersRoles
              );
              openRoomList.push(roomObj);
            } else {
              let roomObj = _.find(openRoomList, room => { return room.roomId === key; });
              if (roomObj) {
                for (let updateKey in creationObject) {
                  if (updateKey === "activeUsers") {
                    roomObj.members = users;
                    if(users){
                      roomObj.members = roomObj.members.map((user)=>{
                        user.userDeviceType = creationObject.userDeviceTypes[user._id.toString()]
                        user.userRole = creationObject.usersRoles[user._id.toString()]
                        return user
                      })
                    }
                  } if (updateKey === "nonActiveUsers") { 
                      if(nonActiveUsersList.length > 0) {
                        roomObj.nonActiveUsers = nonActiveUsersList
                      }
                  } else {
                    roomObj[updateKey] = creationObject[updateKey];
                  }
                }
              }
            }

          } catch (err) {
            console.log("Error in update is : ", err);
          }
        }
      }
    }
    return openRoomList;
  }

  static getOpenRoomPromise(
    activeUsers,
    creatorName,
    title,
    agenda,
    key,
    creationTimeUTC,
    udpAddress,
    env,
    roomLinkId,
    password,
    roomLoaded,
    users,
    client,
    teamId,
    userDeviceTypes,
    nonActiveUsers,
    usersRoles
  ) {
    for (let user of users) {
      user.initials = user.first_name.charAt(0) + user.last_name.charAt(0);
    }
    let stateVR = "default";
    let stateViewer = "default";

    const roomObj = new OpenRoomInfo(
      false,creatorName,title,agenda,key,creationTimeUTC,udpAddress,users,env,roomLinkId,roomLoaded,password,client,teamId,stateViewer,stateVR,userDeviceTypes,nonActiveUsers,usersRoles);
    return roomObj;
  }

  static async populateOpenRoomsListDup( response  ) {
    let dataBO = {};
    if (Object.keys(response).length !== 0) {
      let data = response;
      for (const key in data) {
        dataBO[key] = [];
            if(Object.keys(data[key]).length > 0){
              let dataaX = data[key];
              let openRoomList =  [];
              for (const key_X in dataaX) {
                let roomProps =  dataaX[key_X];
                let creatorName = roomProps[communicationConstants.GameParameter.CreatorUserName];
                let title = roomProps[communicationConstants.GameParameter.Title];
                let agenda = roomProps[communicationConstants.GameParameter.Agenda];
                let udpAddress = roomProps[communicationConstants.GameParameter.UdpAddress];
                let creationTimeUTC = roomProps[communicationConstants.GameParameter.CreationTimeUTC];
                let activeUsers = roomProps[communicationConstants.GameParameter.ActiveUser];
                let userDeviceTypes = roomProps[communicationConstants.GameParameter.UserDeviceType];
                let env = roomProps[communicationConstants.GameParameter.RoomEnvironment];
                let roomLinkId = roomProps[communicationConstants.GameParameter.SavedRoomLinkId];
                let password = roomProps[communicationConstants.GameParameter.Password];
                let roomLoaded = roomProps[communicationConstants.GameParameter.RoomLoaded];
                let teamId = roomProps[communicationConstants.GameParameter.TeamId];
                let nonActiveUsers = roomProps[communicationConstants.GameParameter.NonActiveUsers];
                let usersRoles = roomProps[communicationConstants.GameParameter.UsersRoles];
                const client = key;
                roomLinkId = roomLinkId ? roomLinkId : key_X;

                const nonActiveUsersList = await User.mapNonInvitedUsers(User, nonActiveUsers);
                if (activeUsers && activeUsers.length) {
                  let users = await User.find({ _id: activeUsers }).select('first_name email last_name profilePic');
                  let openRoomPromise = OpenRoomInfo.getOpenRoomPromise(
                    activeUsers,creatorName,title,agenda,key_X,creationTimeUTC,udpAddress,env,roomLinkId,password,roomLoaded,users,client,teamId,userDeviceTypes,nonActiveUsersList,usersRoles);
                    openRoomList.push(openRoomPromise);
                } else {
                  let stateVR = "default";
                  let stateViewer = "default";
                  const roomObj = new OpenRoomInfo(
                    false,creatorName,title,agenda,key_X,creationTimeUTC,udpAddress,[],env,roomLinkId,roomLoaded,password,client,teamId,stateViewer,stateVR,userDeviceTypes,nonActiveUsersList,usersRoles);
                  openRoomList.push(roomObj);
                }
              }
              dataBO[key] = openRoomList;
            }
          }
        }
        return dataBO;
  }

}

class SaveRoomInfo extends BasicRoomInfo {
  constructor(
    creatorName,
    title,
    agenda,
    roomId,
    creationDate,
    environment,
    roomLinkId,
    client,
    teamId,
    password = null
  ) {
    super(
      creatorName,
      title,
      agenda,
      roomId,
      creationDate,
      roomLinkId,
      client,
      teamId,
      password
    );
    this.environment = environment;
    this.loadRoomSent = false;
  }

  static populateAllSavedRoomsList(response) {
    let dataBO = {};
    if (Object.keys(response).length !== 0) {
      let data = response;
      for (const key in data) {
        dataBO[key] = [];
            if(Object.keys(data[key]).length > 0){
              let dataaX = data[key];
              let savedRoomList =  [];
              for (const key_X in dataaX) {
                  const roomProps =  JSON.parse(dataaX[key_X]);
                  const creator = roomProps.creator;
                  const client = roomProps.client;
                  const title = roomProps.title;
                  const agenda = roomProps.description;
                  const environment = roomProps.environment;
                  const roomLinkId = roomProps.linkId;
                  const password = roomProps.password;
                  const teamId = roomProps.team?._id;
                  const savedDate = parseInt(roomProps.saved);
                  const roomObj = new SaveRoomInfo(creator, title,agenda,key_X,savedDate,environment,roomLinkId,client,teamId, password);
                  savedRoomList.push(roomObj);
              }
              dataBO[key] = savedRoomList
            } 
      }
    }

     //Sorting Saved Rooms with creation Date
      for (const key in dataBO) {
        if (dataBO[key].length > 0) {
           dataBO[key] = _.orderBy(dataBO[key], ["creationDate"], ["desc"]);
        }
      }

  return dataBO;
}

  static updateSavedRoomsList(alreadySavedRoomList, response) {
    let savedRoomList = alreadySavedRoomList || [];
    if (Object.keys(response).length !== 0) {
      let data = response;
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const roomProperties = JSON.parse(data[key]);
          if (roomProperties.Removed) {
            savedRoomList = savedRoomList.filter(r => r.roomId !== key);
          } else {
            const creator = roomProperties.creator;
            const title = roomProperties.title;
            const agenda = roomProperties.description;
            const environment = roomProperties.environment;
            const roomLinkId = roomProperties.linkId;
            const password = roomProperties.password;
            const client = roomProperties.client;
            const teamId = roomProperties.team?._id;
            const savedDate = parseInt(roomProperties.saved);
            const roomObj = new SaveRoomInfo(
              creator,
              title,
              agenda,
              key,
              savedDate,
              environment,
              roomLinkId,
              client,
              teamId,
              password
            );
            const oldRoomIndex = savedRoomList.findIndex(r => r.roomId === key);
            if (oldRoomIndex !== -1) {
              savedRoomList[oldRoomIndex] = roomObj;
            } else {
              savedRoomList.push(roomObj);
            }
          }
        }
      }
    }
    return savedRoomList;
  }
}

module.exports.OpenRoomInfo = OpenRoomInfo
module.exports.SaveRoomInfo = SaveRoomInfo