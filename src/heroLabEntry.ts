import { isLocalhost } from './systems/localHost';

if (isLocalhost()) {
  void import('./heroLab');
} else {
  window.location.replace('./index.html');
}
