import { getEnvironmentConfig, getCurrentEnvironment } from './aws-config';

/**
 * 현재 환경에 맞는 Amplify 설정을 가져오는 함수
 * @returns AmplifyConfiguration - 환경별 설정
 */
export function getAmplifyConfig() {
  const environment = getCurrentEnvironment();
  return getEnvironmentConfig(environment);
}

// 기존 설정 (하위 호환성을 위해 유지)
const amplifyConfig = getAmplifyConfig();

export { amplifyConfig };
