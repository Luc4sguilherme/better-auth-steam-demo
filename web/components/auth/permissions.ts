import { createAccessControl } from "better-auth/plugins/access"
import {
  defaultStatements,
  userAc,
  adminAc,
} from "better-auth/plugins/admin/access"

export const accessControl = createAccessControl(defaultStatements)

export const user = accessControl.newRole({
  ...userAc.statements,
  user: [...userAc.statements.user, "list"],
})

export const admin = accessControl.newRole(adminAc.statements)
