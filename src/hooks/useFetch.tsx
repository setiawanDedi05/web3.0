import { useEffect, useState } from "react";

const API_KEY = import.meta.env.VITE_GIPHY_API;
interface FetchGiftProps{
    keyword: string
}
const useFetch = ({ keyword }: FetchGiftProps) => {
    const [giftUrl, setGiftUrl] = useState("");
    const fetchGifts = async () => {
        try {
            const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${keyword.split(" ").join("")}&limit=1`);
            const { data } = await response.json();
            if(data.length){
                setGiftUrl(data[0]?.images?.downsized_medium?.url);
            }else{
                setGiftUrl('https://media4.popsugar-assets.com/files/2013/11/07/832/n/1922398/eb7a69a76543358d_28.gif')
            }
        } catch (error) {
            console.log(error)
            setGiftUrl('https://media4.popsugar-assets.com/files/2013/11/07/832/n/1922398/eb7a69a76543358d_28.gif')
        }
    }

    useEffect(()=>{
        if(keyword) fetchGifts();
    },[keyword])

    return giftUrl;
}

export default useFetch;