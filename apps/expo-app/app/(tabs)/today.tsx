import { withScreenEnter } from '@/motion';
import { TodayScreen } from '@/screens/today';

/**
 * 标签页根容器：Expo Router 换页是瞬时挂载，包一层落位，
 * 让「切了页」在内容上也有交代。屏幕自己不认识动效。
 */
export default withScreenEnter(TodayScreen);
