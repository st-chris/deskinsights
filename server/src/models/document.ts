import mongoose, { Schema, Document } from 'mongoose';

export interface IVersion {
  content: string;
  timestamp: Date;
  versionNumber: number;
  preview?: string;
  fullPreview?: string;
}

export interface IDocument extends Document {
  title: string;
  content: string;
  plainText: string;
  workspaceId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  lastEditedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  characterCount: number;
  isArchived: boolean;
  isPinned: boolean;
  versions: IVersion[];
}

const versionSchema = new Schema<IVersion>({
  content: {
    type: String,
    default: '',
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  versionNumber: {
    type: Number,
    required: true,
  },
});

const documentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: true,
      default: 'Untitled Document',
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      default: '',
    },
    plainText: {
      type: String,
      default: '',
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    versions: {
      type: [versionSchema],
      default: [],
    },
  },
  { timestamps: true },
);

documentSchema.index({ workspaceId: 1 });
documentSchema.index({ createdBy: 1 });
documentSchema.index({ lastEditedBy: 1 });
documentSchema.index({ workspaceId: 1, isArchived: 1 });

export default mongoose.model<IDocument>('Document', documentSchema);
