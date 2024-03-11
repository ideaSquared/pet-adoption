import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
	participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	startedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
	startedAt: { type: Date, required: true },
	lastMessage: { type: String, required: true },
	lastMessageAt: { type: Date, required: true },
	lastMessageBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
	subject: { type: String },
	status: { type: String, required: true, enum: ['active', 'closed'] },
	unreadMessages: { type: Number, required: true },
	messagesCount: { type: Number, required: true },
});

export default mongoose.model('Conversation', conversationSchema);
