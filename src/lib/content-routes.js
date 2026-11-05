export const contentKind=collection=>({activities:'activity',campaigns:'campaign',pages:'page'})[collection];
export const contentPath=record=>`${({activity:'/activities',campaign:'/campaigns',page:'/pages'})[record.kind]||'/pages'}/${record.slug}`;
