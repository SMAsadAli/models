// Require Mongoose
var mongoose = require('mongoose')
var _ = require('lodash')
var errorHandler = require('../helpers/errorHandler')
var HttpStatus = require('http-status-codes')
var moment = require('moment')

// Define a schema
var Schema = mongoose.Schema

var MeetingUserSchema = new Schema({
  device: String,
  itemsPlaced: {
    type: Number,
    default: 0
  },
  filesUploaded: {
    type: Number,
    default: 0
  },
  timeMeetingJoined: {
    type: Date,
    default: Date.now
  },
  timeMeetingLeft: {
    type: Date
  },
  state: {
    type: String,
    enum: ['IN MEETING', 'LEFT']
  },
  filesAdded: { type: [String] },
  filesDownloaded: { type: [String] },
  filesExported: { type: [String] },
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'meeting_users' })

MeetingUserSchema.statics.CONSTANTS = {
  FIELDS: {
    DEVICE: 'device',
    STATE: 'state',
    TIME_MEETING_JOINED: 'timeMeetingJoined',
    TIME_MEETING_LEFT: 'timeMeetingLeft',
    ITEMS_PLACED: 'itemsPlaced',
    FILES_UPLOADED: 'filesUploaded',
    FILES_ADDED: 'filesAdded',
    FILES_DOWNLOADED: 'filesDownloaded',
    FILES_ADDED: 'filesExported',
    MEETING: 'meeting',
    USER: 'user',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAT'
  },
  PARAMS: {
    DEVICE: 'device',
    ITEMS_PLACED: 'itemsPlaced',
    FILES_ADDED: 'filesAdded',
    FILES_DOWNLOADED: 'filesDownloaded',
    FILES_EXPORTED: 'filesExported',
    FILES_UPLOADED: 'filesUploaded',
    STATE: 'state'
  },
  STATES: {
    IN_MEETING: 'IN MEETING',
    LEFT: 'LEFT'
  }
}

MeetingUserSchema.statics.upsertMeetingMembers = async (params, meeting, MeetingUser, User, next) => {
  for (let member of params.members) {
    if (!member.id) {
      let message = 'Member Id not given'
      next(errorHandler.setCustomError(message, HttpStatus.BAD_REQUEST))
    }

    let userMember = meeting.members.find(meetingMember => { return meetingMember.user._id.toString() === member.id })
    if (!userMember) {
      let user = await User.findById(member.id)
      if (!user) {
        let message = 'User Not Found'
        next(errorHandler.setCustomError(message, HttpStatus.NOT_FOUND))
      }
      let memberUser = _.cloneDeep(member)
      memberUser.user = member.id
      memberUser.username = user.email
      memberUser.meeting = meeting._id
      delete memberUser.id
      for (let attribute in member) {
        memberUser[attribute] = member[attribute]
      }
      memberUser.state = MeetingUser.CONSTANTS.STATES.IN_MEETING
      memberUser = await MeetingUser.create(memberUser)
      meeting.members.push(memberUser._id)
      await meeting.save()
    } else {
      let meetingUser = await MeetingUser.findOne({ user: member.id, meeting: meeting._id, state: MeetingUser.CONSTANTS.STATES.IN_MEETING })
      if (meetingUser) {
        for (let attribute in member) {
          if (attribute === MeetingUser.CONSTANTS.PARAMS.ITEMS_PLACED || attribute === MeetingUser.CONSTANTS.PARAMS.FILES_UPLOADED) {
            meetingUser[attribute] += member[attribute]
          } else if (attribute === MeetingUser.CONSTANTS.PARAMS.FILES_ADDED) {
            meetingUser.filesAdded = meetingUser.filesAdded.concat(member[attribute])
          } else if (attribute === MeetingUser.CONSTANTS.PARAMS.FILES_DOWNLOADED) {
            meetingUser.filesDownloaded = meetingUser.filesDownloaded.concat(member[attribute])
          } else if (attribute === MeetingUser.CONSTANTS.PARAMS.FILES_EXPORTED) {
            meetingUser.filesExported = meetingUser.filesExported.concat(member[attribute])
          } else if (attribute === MeetingUser.CONSTANTS.PARAMS.STATE && member[attribute] === MeetingUser.CONSTANTS.STATES.LEFT) {
            meetingUser.timeMeetingLeft = moment()
            meetingUser[attribute] = member[attribute]
          } else {
            meetingUser[attribute] = member[attribute]
          }
        }
        await meetingUser.save()
      } else {
        let user = await User.findById(member.id)
        if (!user) {
          let message = 'User Not Found'
          next(errorHandler.setCustomError(message, HttpStatus.NOT_FOUND))
        }
        let memberUser = _.cloneDeep(member)
        memberUser.user = member.id
        memberUser.username = user.email
        memberUser.meeting = meeting._id
        delete memberUser.id
        for (let attribute in member) {
          memberUser[attribute] = member[attribute]
        }
        memberUser.state = MeetingUser.CONSTANTS.STATES.IN_MEETING
        memberUser = await MeetingUser.create(memberUser)
        meeting.members.push(memberUser._id)
        await meeting.save()
        //   let message = 'User not found or has left meeting'
        //   next(errorHandler.setCustomError(message, HttpStatus.BAD_REQUEST))
      }
    }
  }
}

module.exports = mongoose.model('MeetingUser', MeetingUserSchema)
