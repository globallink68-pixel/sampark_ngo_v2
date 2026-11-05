import sharp from 'sharp';
export async function sanitizeImage(buffer){
 const input=sharp(buffer,{limitInputPixels:20000000,failOn:'warning'});
 const metadata=await input.metadata();
 if(!['jpeg','png','webp'].includes(metadata.format)||metadata.pages>1)throw Error('Unsupported image');
 return input.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();
}
