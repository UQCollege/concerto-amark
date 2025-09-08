import { useAppSelector } from "../store/hooks";
import { useAuth } from "../utils/useAuth";
import { Button } from 'primereact/button';


const AppContent: React.FC = () => {
  const { accessToken, login, logout } = useAuth();
const user=useAppSelector((state)=> state.auth.user)
  return (
    <div>
      {accessToken ? (
        <>
          <h3>{user} Logged in</h3>
          <Button label="Log out"  severity="secondary" raised onClick={logout} rounded />
       
        </>
      ) : (
         <Button label="Log in" severity="secondary" raised onClick={login} rounded/>

      )}
    </div>
  );
};

const Home = () => { 

    return (
  
      <AppContent />


    )
}

export default Home;