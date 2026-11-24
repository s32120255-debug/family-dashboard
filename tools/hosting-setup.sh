# 새 주소(kmsysh-fa740.web.app)에 GitHub가 자동으로 올릴 수 있게 한 번만 허락해 두는 설정이에요.
# 키(비밀번호) 파일은 만들지 않아요. 이 저장소(s32120255-debug/family-dashboard)만 올릴 수 있어요.
P=kmsysh-fa740; N=36140585172; R=s32120255-debug/family-dashboard; SA=hosting-deploy@$P.iam.gserviceaccount.com
gcloud config set project $P
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com firebasehosting.googleapis.com
gcloud iam service-accounts create hosting-deploy --display-name="GitHub hosting deploy" 2>/dev/null
for r in roles/firebasehosting.admin roles/serviceusage.apiKeysViewer roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $P --member="serviceAccount:$SA" --role=$r --condition=None --quiet >/dev/null
done
gcloud iam workload-identity-pools create github --location=global --display-name=GitHub 2>/dev/null
gcloud iam workload-identity-pools providers create-oidc family-dashboard --location=global --workload-identity-pool=github \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$R'" 2>/dev/null
gcloud iam service-accounts add-iam-policy-binding $SA --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$N/locations/global/workloadIdentityPools/github/attribute.repository/$R" --quiet >/dev/null
curl -s -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "x-goog-user-project: $P" \
  -H "Content-Type: application/json" -d '{}' "https://firebasehosting.googleapis.com/v1beta1/projects/$P/sites?siteId=$P" >/dev/null
echo "✅ 끝났어요"
