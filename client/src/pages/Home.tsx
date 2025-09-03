import { useAppSelector } from "../store/hooks";
// import { AuthProvider } from "../AuthProvider";
import { useAuth } from "../utils/useAuth";

const AppContent: React.FC = () => {
  const { accessToken, login, logout } = useAuth();
const user=useAppSelector((state)=> state.auth.user)
  return (
    <div>
      <h1>amark.mydomain.com</h1>

      {accessToken ? (
        <>
          <p>{user} Logged in with access token</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
};

const Home = () => {
    // const user=useAppSelector((state)=> state.auth.user)
    // const {accessToken, login, logout} = useAuth();
  

    return (
  
      <AppContent />


    )
}

export default Home;