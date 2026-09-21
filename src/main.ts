import "./styles.css";
import "./game";
import { initSocial } from "./scenes/socialScene";
import { initOnline } from "./scenes/onlineScene";
import { initUiScale } from "./ui/uiScale";
import { initVersionChecker } from "./systems/versionChecker";
import { initDisplayMode } from "./systems/displayMode";
import { isLocalhost } from "./systems/localHost";

const heroLabLink = document.getElementById("heroLabLink");
if (heroLabLink && isLocalhost()) {
  heroLabLink.hidden = false;
}

initUiScale();
// Guard-обработчики жестов ставятся заранее, активируются только в игровом режиме.
initDisplayMode();
initSocial();
initOnline();
// Подпись версии в главном меню (#menuVersion) и фоновая проверка обновлений.
initVersionChecker();
