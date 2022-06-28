import zlib from 'zlib';
import { S3, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3({
    endpoint: process.env.S3_ENDPOINT || "https://nyc3.digitaloceanspaces.com", // Find your endpoint in the control panel, under Settings. Prepend "https://".
    region: process.env.S3_REGION || "us-east-1", // Must be "us-east-1" when creating new Spaces. Otherwise, use the region in your endpoint (e.g. nyc3).
});

const S3_BUCKET = process.env.S3_BUCKET || 'bsc-blocks';

async function uploadObject(Bucket, Key, Body) {

  const params = {
    Bucket, // The path to the directory you want to upload the object to, starting with your Space name.
    Key, // Object key, referenced whenever you want to access this file later.
    Body // The object's contents. This variable is an object, not a string.
  };
  
  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    console.log(
      "Successfully uploaded object: " +
        params.Bucket +
        "/" +
        params.Key
    );
    return data;
  } catch (err) {
    console.log("s3 upload error", err);
  }
}

const streamToString = (stream) => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

async function headObject(Bucket, Key) {
  const bucketParams = { Bucket, Key };
  try {
    const response = await s3Client.send(new HeadObjectCommand(bucketParams));
    console.log("Exists", Key, response.LastModified);
    return true;
  } catch (err) {
    if (err.name == 'NotFound') {
      console.log("Doesn't Exist", Key);
      return false;
    } else {
      console.log("s3 download Error", err);
      return null;
    }
  }
};

async function downloadObject(Bucket, Key) {
  const bucketParams = { Bucket, Key };
  try {
    const response = await s3Client.send(new GetObjectCommand(bucketParams));
    const data = await streamToString(response.Body);
    //console.log("Success", data);
    return data;
  } catch (err) {
    console.log("s3 download Error", err);
    return null;
  }
};

export async function _saveCache(fname, data) {
  let din = JSON.stringify(data);
  let dgz = zlib.gzipSync(din);
  await uploadObject(S3_BUCKET, fname+'.gz', dgz );
}

export async function _loadCache(fname) {
  let dzip = await downloadObject(S3_BUCKET, fname+'.gz');
  if (dzip == null) { return dzip; } //handle not found
  let data = zlib.gunzipSync(dzip).toString();
  return JSON.parse(data);
}

export async function _checkCache(fname) {
  return await headObject(S3_BUCKET, fname+'.gz');
}

/*
await _saveCache('testing', {'abc':134});
console.log(await _checkCache('blah'));
console.log(await _checkCache('testing'));
console.log(await _loadCache('testing'));
*/
