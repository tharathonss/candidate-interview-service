import mongoose, { Schema } from "mongoose";

const CommentSchema = new Schema(
    {
        cardId: { type: Schema.Types.ObjectId, ref: "Card", required: true, index: true },
        body: { type: String, required: true },
        authorId: { type: Number, required: true },
    },
    { timestamps: true }
);

export const Comment = mongoose.model("Comment", CommentSchema);