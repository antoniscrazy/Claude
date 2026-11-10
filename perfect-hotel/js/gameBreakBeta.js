// Lokaler Ersatz für die Google-Ad-Breaks: keine Werbung, Belohnungen gibt es sofort.
// Das Spiel ruft showNextAd() (Zwischenwerbung) und showReward() (Belohnungs-Werbung) auf.
function showNextAd() {
    // Keine Werbung – das Spiel läuft einfach weiter.
    myGameInstance.SendMessage('GameObjectAds', 'resumeGame');
}

function showReward() {
    // Belohnung sofort gewähren, als wäre die Werbung angesehen worden.
    gainReward();
}

function noRewardAdsAvailable() {
    myGameInstance.SendMessage('GameObjectAds', 'NoRewardedAdsTryLater');
}

function cancelReward() {
    myGameInstance.SendMessage('GameObjectAds', 'resumeGameRewarded');
    myGameInstance.SendMessage('GameObjectAds', 'rewardAdsCanceled');
}

function gainReward() {
    myGameInstance.SendMessage('GameObjectAds', 'resumeGameRewarded');
    myGameInstance.SendMessage('GameObjectAds', 'rewardAdsCompleted');
}

function passBeforeAdData() {
    myGameInstance.SendMessage('GameObjectAds', 'pauseGame');
}

function adBreakDoneData() {
    myGameInstance.SendMessage('GameObjectAds', 'resumeGame');
}
