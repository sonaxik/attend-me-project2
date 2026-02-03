import {defineStore} from 'pinia';
import {ref, computed} from 'vue';
import {Backend} from '@/main';
import type {User, TokenResult} from '@/backend/AttendMeBackendClientBase';

export const useAuthStore = defineStore('auth', ()=>
{
    const token = ref<string | null>(localStorage.getItem('auth_token'));
    const user = ref<User | null>(null);
    const isAuthenticated = computed(()=>!!token.value);
    const isTeacher = computed(() => !!user.value?.isTeacher);

    if(token.value) //gemini 3 pro: błąd 401 podczas uruchamiania widoku pulpitu wykładowcy
    {
        Backend.userTokenResult = {token: token.value};
    }

    async function login(loginName: string, pass: string)
    {
        try
        {
            const result: TokenResult = await Backend.userLogin(loginName,pass);
            if(result && result.token)
            {
                token.value = result.token;
                localStorage.setItem('auth_token', result.token);
                Backend.userTokenResult = result; //gemini 3 pro: błąd 401 podczas uruchamiania widoku pulpitu wykładowcy
                await fetchCurrentUser();
                return true;
            }
        }
        catch (error)
        {
            console.error("Błąd logowania", error);
            return false;
        }
        return false;
    }
    function logout()
    {
        token.value = null;
        user.value = null;
        localStorage.removeItem('auth_token');
        Backend.userTokenResult = undefined; //gemini 3 pro: błąd 401 podczas uruchamiania widoku pulpitu wykładowcy
    }
    async function fetchCurrentUser()
    {
        if(!token.value) return;
        try
        {
            const userData = await Backend.userGet(undefined);
            user.value = userData;
        }
    catch (error)
    {
        console.error("nie udało się pobrać danych o użytkowniku", error);
        logout();
    }
    }
    return {
        token,
        user,
        isAuthenticated,
        isTeacher,
        login,
        logout,
        fetchCurrentUser
    }
})