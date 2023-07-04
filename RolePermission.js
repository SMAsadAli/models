// Require Mongoose
var mongoose = require('mongoose')
// Define a schema
var Schema = mongoose.Schema

var ResourcePermissionSchema = new Schema({
    name: String,
    key: String,
    permissions: [String]
})


var RolePermissionSchema = new Schema({
    name: String,
    key: {
        type: String,
        unique: true
    },
    resources: [ResourcePermissionSchema]
}, { collection: 'role_permissions' })


module.exports = mongoose.model('RolePermission', RolePermissionSchema)