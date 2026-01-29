import UserSchema from '../models/user';

const usersInDb = async () => {
  const users = await UserSchema.find({});
  return users.map((user) => user.toJSON());
};

export { usersInDb };
