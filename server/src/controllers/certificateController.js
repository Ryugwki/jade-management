import { Certificate } from "../models/Certificate.js";
import { Product } from "../models/Product.js";

const toPayload = (certificate) => ({
  id: certificate._id.toString(),
  product: certificate.product?.toString?.() || certificate.product,
  certificateId: certificate.certificateId,
  authority: certificate.authority,
  status: certificate.status,
  link: certificate.link,
  imageUrl: certificate.imageUrl,
  issuedAt: certificate.issuedAt,
  expiresAt: certificate.expiresAt,
  notes: certificate.notes,
  createdAt: certificate.createdAt,
  updatedAt: certificate.updatedAt,
});

export async function listCertificates(req, res) {
  const query = {};
  if (req.query.productId) {
    query.product = req.query.productId;
  }
  const certificates = await Certificate.find(query)
    .sort({ createdAt: -1 })
    .exec();
  return res.json({ certificates: certificates.map(toPayload) });
}

export async function getCertificate(req, res) {
  const certificate = await Certificate.findById(req.params.id).exec();
  if (!certificate) {
    return res.status(404).json({ message: "Certificate not found" });
  }
  return res.json({ certificate: toPayload(certificate) });
}

export async function createCertificate(req, res) {
  const payload = req.body;
  const certificate = await Certificate.create(payload);

  if (payload.product) {
    await Product.findByIdAndUpdate(payload.product, {
      certificateId: payload.certificateId,
      certificateAuthority: payload.authority,
      certificateStatus: payload.status,
      certificateLink: payload.link || payload.imageUrl || "",
    }).exec();
  }

  return res.status(201).json({ certificate: toPayload(certificate) });
}

export async function updateCertificate(req, res) {
  const payload = req.body;
  const certificate = await Certificate.findByIdAndUpdate(
    req.params.id,
    payload,
    {
      new: true,
    },
  ).exec();

  if (!certificate) {
    return res.status(404).json({ message: "Certificate not found" });
  }

  if (certificate.product) {
    await Product.findByIdAndUpdate(certificate.product, {
      certificateId: certificate.certificateId,
      certificateAuthority: certificate.authority,
      certificateStatus: certificate.status,
      certificateLink: certificate.link || certificate.imageUrl || "",
    }).exec();
  }

  return res.json({ certificate: toPayload(certificate) });
}

export async function deleteCertificate(req, res) {
  const certificate = await Certificate.findByIdAndDelete(req.params.id).exec();
  if (!certificate) {
    return res.status(404).json({ message: "Certificate not found" });
  }
  return res.json({ message: "Certificate deleted" });
}
