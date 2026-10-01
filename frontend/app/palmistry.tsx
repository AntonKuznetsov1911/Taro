import { Redirect } from 'expo-router';

// Гадание по ладони живёт на экране камеры: снимок, затем описание ладони.
// Этот адрес оставлен ради старых ссылок и ведёт туда же.
export default function PalmistryRedirect() {
  return <Redirect href="/camera" />;
}
