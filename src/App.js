import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import './App.css';
import DiaryEditor from './DiaryEditor';
import DiaryList from './DiaryList';

// 복잡한 상태 변화 로직를 AppComponent와 분리하기 위해 App 밖에 선언
const reducer = (state, action) => {
  // (상태 변화가 일어나기 직전 state, action 객체)
  switch (action.type) {
    case 'INIT': {
      return action.data; // return한 값이 새로운 state가 됨
    }
    case 'CREATE': {
      const created_date = new Date().getTime();
      const newItem = {
        ...action.data,
        created_date,
      };
      return [newItem, ...state];
    }
    case 'REMOVE': {
      return state.filter((it) => it.id !== action.targetId);
    }

    case 'EDIT': {
      return state.map((it) =>
        it.id === action.targetId ? { ...it, content: action.newContent } : it
      );
    }
    default:
      return state;
  }
};

export const DiaryStateContext = React.createContext();
export const DiaryDispatchContext = React.createContext();

const App = () => {
  const [data, dispatch] = useReducer(reducer, []);
  const dataId = useRef(0);

  const getData = async () => {
    const result = await fetch(
      'https://jsonplaceholder.typicode.com/comments'
    ).then((result) => result.json());

    const initData = result.slice(0, 20).map((it) => {
      return {
        author: it.email,
        content: it.body,
        emotion: Math.floor(Math.random() * 5) + 1,
        created_date: new Date().getTime(),
        id: dataId.current++,
      };
    });

    dispatch({ type: 'INIT', data: initData });
  };

  useEffect(() => {
    getData();
  }, []);

  const onCreate = useCallback((author, content, emotion) => {
    dispatch({
      type: 'CREATE',
      data: { author, content, emotion, id: dataId.current },
    });
    dataId.current += 1;
    // 항상 최신의 state 참조를 도와주는 함수형 업데이트 방법
  }, []);

  const onEdit = useCallback((targetId, newContent) => {
    dispatch({ type: 'EDIT', targetId, newContent });
  }, []);

  const onRemove = useCallback((targetId) => {
    dispatch({ type: 'REMOVE', targetId });
  }, []);

  // Context.Provider value에 넘겨줄 변수 store
  const store = {
    data,
  };
  // App 컴포넌트가 재생성 될 때 함수도 재생성 되지 않게 하기 위해 useMemo 사용
  const memoizedDispatches = useMemo(() => {
    return { onCreate, onEdit, onRemove };
  }, []);

  const getDiaryAnalysis = useMemo(() => {
    // useMemo로 부터 값을 return 받기 때문에 더이상 함수가 아님
    const goodCount = data.filter((it) => it.emotion >= 3).length;
    const badCount = data.length - goodCount;
    const goodRatio = (goodCount / data.length) * 100;
    return { goodCount, badCount, goodRatio };
  }, [data.length]); // dependency array가 변화할 때만 실행 (data.length 즉, 일기 갯수가 변하지 않는 이상 실행 안함)

  const { goodCount, badCount, goodRatio } = getDiaryAnalysis;

  return (
    <DiaryStateContext.Provider value={store}>
      <DiaryDispatchContext.Provider value={memoizedDispatches}>
        <div className='App'>
          <h2>Diary</h2>
          <DiaryEditor />
          <DiaryList />
        </div>
      </DiaryDispatchContext.Provider>
    </DiaryStateContext.Provider>
  );
};

export default App;
