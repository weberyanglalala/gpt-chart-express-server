require('dotenv').config();
const express = require('express');
const { render } = require('@antv/gpt-vis-ssr');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
const port = process.env.PORT || 3000;


app.use(express.json());

app.post('/api/chart', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Missing required parameters: type and data'
      });
    }

    const options = {
      type: type,
      data: data,
    };

    const vis = await render(options);
    const buffer = vis.toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `chart-${timestamp}.jpg`;

    // Check required environment variables
    const bucketName = process.env.R2_BUCKET_NAME;
    const endpointUrl = process.env.R2_ENDPOINT_URL;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!bucketName || !endpointUrl || !accessKeyId || !secretAccessKey || !publicUrl) {
      return res.status(500).json({
        success: false,
        errorMessage: 'Missing required R2 configuration. Please set R2_BUCKET_NAME, R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL environment variables.'
      });
    }

    // Upload to Cloudflare R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: endpointUrl,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    const uploadParams = {
      Bucket: bucketName,
      Key: filename,
      Body: buffer,
      ContentType: 'image/png',
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Return the public URL to access the image
    const imageUrl = `${publicUrl}/${filename}`;

    res.json({
      success: true,
      resultObj: imageUrl
    });

  } catch (error) {
    console.error('Chart generation error:', error);

    res.status(500).json({
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

app.listen(port, () => {
  console.log(`Chart server running on port ${port}`);
});
