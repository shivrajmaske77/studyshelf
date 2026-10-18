import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter a resource title."],
      trim: true,
      maxlength: [100, "Title must be 100 characters or fewer."]
    },
    subject: {
      type: String,
      required: [true, "Please enter a subject."],
      trim: true,
      maxlength: [60, "Subject must be 60 characters or fewer."]
    },
    description: {
      type: String,
      required: [true, "Please enter a short description."],
      trim: true,
      maxlength: [500, "Description must be 500 characters or fewer."]
    },
    type: {
      type: String,
      required: [true, "Please choose a resource type."],
      enum: ["Notes", "Video", "Website", "Other"]
    },
    url: {
      type: String,
      required: [true, "Please enter a link to the resource."],
      trim: true,
      match: [/^https?:\/\/.+/i, "Please enter a valid link beginning with http:// or https://."]
    },
    uploadedBy: {
      type: String,
      required: [true, "Please enter your name."],
      trim: true,
      maxlength: [60, "Name must be 60 characters or fewer."]
    }
  },
  { timestamps: true }
);

export default mongoose.model("Resource", resourceSchema);
