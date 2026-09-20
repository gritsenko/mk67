import "./styles.css";
import "./game";
import { initSocial } from "./scenes/socialScene";
import { initOnline } from "./scenes/onlineScene";
import { initUiScale } from "./ui/uiScale";
import { initVersionChecker } from "./systems/versionChecker";

initUiScale();
initSocial();
initOnline();
// Подпись версии в главном меню (#menuVersion) и фоновая проверка обновлений.
initVersionChecker();
