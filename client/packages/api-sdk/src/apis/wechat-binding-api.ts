import {
  deleteWechatUnbindByPlatform,
  getGetWechatBindingQueryKey,
  getGetWechatMpOauthStateQueryKey,
  getWechatBinding,
  getWechatMpOauthState,
  postWechatBindMini,
  postWechatBindMp,
  useDeleteWechatUnbindByPlatform,
  useGetWechatBinding,
  useGetWechatMpOauthState,
  usePostWechatBindMini,
  usePostWechatBindMp,
} from '../generated/endpoints/微信绑定/微信绑定';
import type {
  WeChatBindingView as GeneratedWeChatBindingView,
  GetWechatMpOauthState200,
  WeChatMiniBindCommand,
  WeChatMpBindCommand,
} from '../generated/models';

export type WeChatBindingView = GeneratedWeChatBindingView;
export type WeChatMpBindInput = WeChatMpBindCommand;
export type WeChatMiniBindInput = WeChatMiniBindCommand;
export type WeChatMpOauthState = GetWechatMpOauthState200;

export const wechatBindingQueryKeys = {
  bindings: getGetWechatBindingQueryKey,
  mpOauthState: getGetWechatMpOauthStateQueryKey,
};

export const wechatBindingApi = {
  myBindings: getWechatBinding,
  generateMpOauthState: getWechatMpOauthState,
  bindMp: postWechatBindMp,
  bindMini: postWechatBindMini,
  unbind: deleteWechatUnbindByPlatform,
};

export const useWechatBindings = useGetWechatBinding;
export const useWechatMpOauthState = useGetWechatMpOauthState;
export const useBindWechatMp = usePostWechatBindMp;
export const useBindWechatMini = usePostWechatBindMini;
export const useUnbindWechat = useDeleteWechatUnbindByPlatform;
