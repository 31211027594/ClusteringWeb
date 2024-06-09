import joblib
import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler


# Đọc dữ liệu từ URL và đặt tên cho các cột
url = 'https://drive.google.com/file/d/1WVzv_qWKTprwUyMrNn91ImB3eg4DYa6v/view?usp=sharing'
url = 'https://drive.google.com/uc?id=' + url.split('/')[-2]

df = pd.read_csv(url, header=None)
column_names = df.iloc[0]
df.columns = column_names
df = df[1:]
df.reset_index(drop=True, inplace=True)
df = df.apply(pd.to_numeric, errors='ignore')
numeric_cols = df.select_dtypes(include=['number'])
data = numeric_cols.copy()



scaler = StandardScaler()
scaler.fit(data)

mean = scaler.mean_.tolist()
std = scaler.scale_.tolist()

# Tải mô hình đã lưu
model = joblib.load('udmh/best_model_KMeans.pkl')

# Chuyển đổi mô hình thành JSON
# Kiểm tra loại mô hình để lấy các centroid tương ứng
if hasattr(model, 'cluster_centers_'):
    centroids = model.cluster_centers_.tolist()  # KMeans có cluster_centers_
elif hasattr(model, 'children_'):
    from scipy.cluster.hierarchy import fcluster
    import numpy as np
    from sklearn.metrics.pairwise import euclidean_distances

    n_clusters = 3  # Số lượng cụm mong muốn, cần điều chỉnh phù hợp với mô hình của bạn
    distances = euclidean_distances(model.children_, model.children_)
    centroids = [np.mean(distances[model.labels_ == i], axis=0).tolist() for i in range(n_clusters)]
else:
    raise ValueError("Không thể chuyển đổi mô hình này sang JSON")

model_json = {
    'centroids': centroids,
    'mean': mean,
    'std': std
}

# Lưu mô hình dưới dạng JSON
with open('udmh/best_cluster_model.json', 'w') as json_file:
    json.dump(model_json, json_file)
