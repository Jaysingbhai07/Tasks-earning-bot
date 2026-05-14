const TelegramBot = require('node-telegram-bot-api');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, runTransaction } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBbqNPQfhPHqZuhZM2zzGQnf4f53Sw-jrU",
    authDomain: "tasksearningsbot.firebaseapp.com",
    projectId: "tasksearningsbot",
    storageBucket: "tasksearningsbot.firebasestorage.app",
    messagingSenderId: "721160571309",
    appId: "1:721160571309:web:35d389bf57f511e6a73924"
};

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(200).send('Server is active');
    try {
        const { message } = req.body;
        if (message && message.text && message.text.startsWith('/start')) {
            const userId = message.from.id;
            const firstName = message.from.first_name;
            const startParam = message.text.split(' ')[1] || null;
            const userRef = doc(db, "users", userId.toString());
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    id: userId, name: firstName, photoURL: `https://ui-avatars.com/api/?name=${firstName}`,
                    coins: 0, reffer: 0, refferBy: startParam, totalWithdrawals: 0,
                    frontendOpened: true, rewardGiven: false, createdAt: serverTimestamp()
                });
                if (startParam) {
                    const refRef = doc(db, "users", startParam.toString());
                    await updateDoc(refRef, { coins: increment(500), reffer: increment(1) });
                }
            }
            await bot.sendPhoto(userId, "https://i.ibb.co/CKK6Hyqq/1e48400d0ef9.jpg", {
                caption: `👋 Welcome ${firstName}!\nYahan tasks karke kamao real cash!`,
                reply_markup: { inline_keyboard: [[{ text: "▶ Open App", web_app: { url: "https://jaysingbhai07.github.io/Tasks-earnings-bot/" } }]] }
            });
        }
        res.status(200).send('OK');
    } catch (e) { res.status(200).send('Error'); }
};
