import UserModel from './user.model.js';
import JobCategoryModel from './jobCategory.model.js';
import JobModel from './job.model.js';

export const models = {
  User: UserModel,
  JobCategory: JobCategoryModel,
  Job: JobModel,
};

export { UserModel, JobCategoryModel, JobModel };

export default models;
