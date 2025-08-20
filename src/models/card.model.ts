import mongoose, { model } from "mongoose";

const CardSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        status: { type: String, enum: ["todo", "inprogress", "done"], default: "todo" },
        createdBy: { type: Number, required: true },
        archived: { type: Boolean, default: false }
    },
    { timestamps: true }
);

CardSchema.index({ updatedAt: -1 });
CardSchema.index({ createdBy: 1, updatedAt: -1 });

export const Card = mongoose.models.Card || model("Card", CardSchema);