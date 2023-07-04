const mongoose = require("mongoose");
const util = require("../helpers/util");
const mailer = require("../helpers/mailer");
const ENV_CONSTANTS = require("../config/envs");
const User = require("./User");
const globalConstants = require("../config/globalConstants");
const OrganizationRole = require("./organizationRolesAndFeatures/OrganizationRole");

const { ORGANIZATIONAL_ROLES } = globalConstants;
const { ORGANIZATIONAL_ADMIN, ORGANIZATIONAL_OWNER } = ORGANIZATIONAL_ROLES;

const Schema = mongoose.Schema;

const TeamDlcVersionSchema = new Schema(
  {
    version: Number,
    name: Number,
  },
  { _id: false }
);

const TeamDlcSchema = new Schema(
  {
    dlcId: String,
    platforms: [TeamDlcVersionSchema],
  },
  { _id: false }
);

const TeamSchema = new Schema(
  {
    teamName: String,
    teamKey: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teamDlcs: [TeamDlcSchema],
    teamMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userRole: { type: mongoose.Schema.Types.ObjectId, ref: "UserRole" },
        userTeamRole: { type: mongoose.Schema.Types.ObjectId, ref: "TeamRole" },
        defaultUserRole: { type: Boolean, default: false },
      },
    ],
    invitedMembers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "TeamMember" },
    ],
    tier: { type: mongoose.Schema.Types.ObjectId, ref: "Tier" },
    tierPrice: Number,
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    savedRooms: [{ type: mongoose.Schema.Types.String, ref: "SavedRoom" }],
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    canceledAt: Number,
    // TODO: need to remove
    canceledSubscription: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    ],
    isDefaultTeam: Boolean,
  },
  { collection: "teams" }
);

TeamSchema.statics.sendMemberInviteEmail = async (
  user,
  teamName,
  inviteeEmail,
  teamMemberId,
  teamId
) => {
  let userExists = await User.findOne({ email: inviteeEmail });
  let invitationLink = `${ENV_CONSTANTS.joinTeamUrl}/${teamId}/${teamMemberId}`;
  let loginLink = `${ENV_CONSTANTS.newPortalLoginUrl}/${teamId}/${teamMemberId}`;

  let theLink = !!userExists ? loginLink : invitationLink;

  const templateName = !!userExists
    ? "team-invite--registered-user.html"
    : "team-invite--new-user.html";
  const templateUrl = `../templates/${templateName}`;
  const template = require(templateUrl);

  let data = {
    inviterFullName: user.first_name + " " + user.last_name,
    inviterEmail: process.env.EMAIL_USERNAME,
    invitationLink: theLink,
    inviterName: userExists
      ? user.first_name + " " + user.last_name
      : `${
          user.first_name + " " + user.last_name
        } invited you to join Team ${teamName} on Arthur`,
    teamName: teamName,
  };

  let emailContent = util.replacer(template, data);
  mailer.sendEmail(
    inviteeEmail,
    process.env.EMAIL_USERNAME,
    "Arthur Team Invitation",
    null,
    emailContent
  );
};

TeamSchema.statics.sendEnterpriseMemberInviteEmail = async ({
  teamMember,
  invites,
  clientName,
  inviterName,
  inviterEmail,
  isSendToSelf,
  isTempPassword,
  userId,
  isOldUser,
  teamId,
}) => {
  const inviteIds = [];
  invites
    ?.forEach((t) => {
      if (!t.message) {
        inviteIds.push(t._id);
      }
    })
    ?.join();
  const userOrgAdminRole = await OrganizationRole.findOne({
    key: ORGANIZATIONAL_ADMIN,
  });
  const userOrgOwnerRole = await OrganizationRole.findOne({
    key: ORGANIZATIONAL_OWNER,
  });
  if (inviteIds.length > 0) {
    const teamNames = invites
      .map((i) => {
        if (Array.isArray(i?.teamId) && teamId) {
          const singleTeam = i?.teamId.find(
            (team) => team._id.toString() === teamId
          );
          if (singleTeam) {
            return i?.teamId.length
              ? i?.teamId.map((id) => id.teamName).join(", ")
              : "";
          }
          return "";
        }
        return i?.teamId?.teamName;
      })
      .filter((teamName) => !!teamName);
    const queryParams = `?joiningSessions=${inviteIds}&verificationCode=${userId}`;
    let invitationLink = `${ENV_CONSTANTS.verifyUrl}${queryParams}`;
    let loginLink = `${ENV_CONSTANTS.newPortalLoginUrl}${queryParams}`;

    let theLink =
      isTempPassword || (isOldUser && !isOldUser?.firstSignIn)
        ? loginLink
        : invitationLink;

    const templateName = isTempPassword
      ? "team-invite--temp-password.html"
      : "team-invite--email-setup.html";
    const templateUrl = `../templates/${templateName}`;
    const template = require(templateUrl);
    const teamsText = `team${
      teamNames?.length > 1 ? "s" : ""
    } ${teamNames?.join(", ")}`;
    let data = {
      clientName,
      invitationLink: theLink,
      inviterName: inviterName,
      inviteeEmail: teamMember?.email,
      buttonText: !isOldUser
        ? isTempPassword
          ? "Login"
          : "Setup my Account"
        : "Accept invite",
      joiningText: !isOldUser
        ? "In order for you to join, click the button below to setup the account and generate your personal avatar."
        : "Click on the button below to accept the invite and find your upcoming VR meetings in the Arthur Portal.",
      headerText: !isOldUser
        ? `${inviterName} invited you to join ${clientName}‘s Virtual Reality Office`
        : `You have been invited to join the ${teamsText} in the ${clientName} VR Office`,
      adminButtonText: isOldUser
        ? "Join Organization"
        : "Setup my Arthur Company Account",
      teamsText,
      question2: !isOldUser
        ? "The setup process is not working"
        : "I can’t access the portal",
      answer2: !isOldUser
        ? "Please make sure to your WiFi is unrestricted to access the webportal."
        : "Make sure to be logged in on the Arthur Portal and that your WiFi has unrestricted access. ",
    };
    if (isTempPassword) {
      data.email = teamMember.email;
      data.password = teamMember.inviteMethod.value;
    }
    let emailContent = util.replacer(template, data);
    const mailSubject = !isOldUser
      ? `Invitation | ${data.clientName}‘s Virtual Reality Office`
      : `${data.inviterName} invited you to a new team in ${data.clientName}‘s VR office`;
    mailer.sendEmail(
      teamMember.email,
      process.env.EMAIL_USERNAME,
      mailSubject,
      null,
      emailContent
    );
    if (isSendToSelf) {
      const selfTemplate = require("../templates/team-invite--temp-password-to-self.html");
      const emailBody = util.replacer(selfTemplate, data);
      mailer.sendEmail(
        inviterEmail,
        process.env.EMAIL_USERNAME,
        mailSubject,
        null,
        emailBody
      );
    }
  }
};

TeamSchema.statics.CONSTANTS = {
  PARAMS: {
    TEAM_ID: "teamId",
  },
  INDIVIDUAL_INVITE_FLOW: {
    CUSTOM_PROFILE_PIC: "customProfilePic",
    INVITE_METHODS: {
      TEMP_PASSWORD: "temporaryPassword",
      INVITE_EMAIL: "inviteEmail",
      PERMANENT_PASSWORD: "permanentPassword",
      MAKE_MEMBER: "makeMember",
    },
  },
};

module.exports = mongoose.model("Team", TeamSchema);
