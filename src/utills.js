import { unlink } from "fs/promises"

export async function FileRemove(path){
    try{
        await unlink(path)
    }catch(e){
        console.log("error",e.message);
    }
}