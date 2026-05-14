const TelegramBot = require('node-telegram-bot-api');
const { initializeApp } = require('firebase/app');
const { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    increment, 
    serverTimestamp, 
    runTransaction 
} = require('firebase/firestore');

// --- 1. FIREBASE CONFIG ---
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

// --- 2. REFERRAL LOGIC ---
async function processReferralReward(userId, referrerId) {
    if (!referrerId || userId.toString() === referrerId.toString()) return;

    const userRef = doc(db, "users", userId.toString());
    const referrerRef = doc(db, "users", referrerId.toString());
    const rewardRef = doc(db, "ref_rewards", userId.toString());

    try {
        await runTransaction(db, async (transaction) => {
            const rewardDoc = await transaction.get(rewardRef);
            const referrerDoc = await transaction.get(referrerRef);

            // Sirf tabhi reward dein jab pehle na mila ho aur referrer exist karta ho
            if (!rewardDoc.exists() && referrerDoc.exists()) {
                transaction.update(referrerRef, {
                    coins: increment(500),
                    reffer: increment(1)
                });

                transaction.set(rewardRef, {
                    userId: userId,
                    referrerId: referrerId,
                    reward: 500,
                    createdAt: serverTimestamp()
                });
            }
        });
    } catch (error) {
        console.error("Referral Error:", error);
    }
}

// --- 3. MAIN HANDLER ---
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(200).send('Server is active');
    }

    try {
        const { message } = req.body;

        if (message && message.text && message.text.startsWith('/start')) {
            const userId = message.from.id;
            const firstName = message.from.first_name;
            
            // Link se referral ID nikalna: /start 12345
            const startParam = message.text.split(' ')[1] || null;

            const userRef = doc(db, "users", userId.toString());
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Naya user register karein
                await setDoc(userRef, {
                    id: userId,
                    name: firstName,
                    photoURL: `https://ui-avatars.com/api/?name=${firstName}&background=random`,
                    coins: 0,
                    reffer: 0,
                    refferBy: startParam,
                    tasksCompleted: 0,
                    totalWithdrawals: 0,
                    frontendOpened: true,
                    rewardGiven: false,
                    createdAt: serverTimestamp()
                });

                // Referral reward process karein
                if (startParam) {
                    await processReferralReward(userId, startParam);
                }
            }

            // Welcome Message bhejien
            const welcomeText = `👋 Hi ${firstName}! Welcome to Tasks Earnings ⭐\n\nYahan aap tasks complete karke real cash kama sakte ho!\n\n🚀 Invite friends and get 500 coins!\n💰 Instant Withdrawal in UPI!\n\nReady to start? Tap the button below!`;

            await bot.sendPhoto(userId, "https://i.ibb.co/CKK6Hyqq/1e48400d0ef9.jpg", {
                caption: welcomeText,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { 
                                text: "▶ Open App", 
                                web_app: { url: "https://jaysingbhai07.github.io/Tasks-earning-bot/" } 
                            }
                        ],
                        [
                            { text: "📢 Join Channel", url: "https://t.me/finisher_tech" }
                        ]
                    ]
                }
            });
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error:', error);
        res.status(200).send('Error Handled');
    }
};
